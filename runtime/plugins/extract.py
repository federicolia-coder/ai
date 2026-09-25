import base64
import binascii
import io
import logging
import re
import zipfile
from xml.etree import ElementTree

from runtime.tools.base import AttachedFile

logger = logging.getLogger(__name__)

MAX_TEXT_CHARS = 200_000
MAX_DECOMPRESSED_BYTES = 30 * 1024 * 1024
MAX_PDF_PAGES = 100

TEXT_MIMES = {"text/plain", "text/markdown", "text/csv", "application/json"}
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
IMAGE_PREFIX = "image/"

_W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
_S = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


class ExtractionError(Exception):
    pass


def _open_zip(data: bytes) -> zipfile.ZipFile:
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as e:
        raise ExtractionError("file corrotto o non valido") from e
    # Guard against zip bombs before decompressing anything.
    if sum(i.file_size for i in zf.infolist()) > MAX_DECOMPRESSED_BYTES:
        raise ExtractionError("file troppo grande una volta decompresso")
    return zf


def _read_xml(zf: zipfile.ZipFile, name: str) -> ElementTree.Element | None:
    try:
        raw = zf.read(name)
    except KeyError:
        return None
    try:
        return ElementTree.fromstring(raw)
    except ElementTree.ParseError as e:
        raise ExtractionError("struttura del documento non leggibile") from e


def _docx_text(data: bytes) -> str:
    zf = _open_zip(data)
    root = _read_xml(zf, "word/document.xml")
    if root is None:
        raise ExtractionError("non sembra un documento Word")
    paragraphs = []
    for p in root.iter(f"{_W}p"):
        parts = []
        for node in p.iter():
            if node.tag == f"{_W}t" and node.text:
                parts.append(node.text)
            elif node.tag == f"{_W}tab":
                parts.append("\t")
        paragraphs.append("".join(parts))
    return "\n".join(paragraphs).strip()


def _column_index(ref: str) -> int:
    letters = re.match(r"[A-Z]+", ref or "")
    if not letters:
        return 0
    n = 0
    for ch in letters.group(0):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def _xlsx_text(data: bytes) -> str:
    zf = _open_zip(data)
    shared: list[str] = []
    ss = _read_xml(zf, "xl/sharedStrings.xml")
    if ss is not None:
        for si in ss.iter(f"{_S}si"):
            shared.append("".join(t.text or "" for t in si.iter(f"{_S}t")))

    sheet_names = sorted(
        (n for n in zf.namelist() if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", n)),
        key=lambda n: int(re.search(r"(\d+)", n.rsplit("/", 1)[1]).group(1)),
    )
    if not sheet_names:
        raise ExtractionError("non sembra un foglio Excel")

    out = []
    for idx, name in enumerate(sheet_names, 1):
        root = _read_xml(zf, name)
        if root is None:
            continue
        out.append(f"## Foglio {idx}")
        for row in root.iter(f"{_S}row"):
            cells: dict[int, str] = {}
            for c in row.iter(f"{_S}c"):
                ctype = c.get("t")
                if ctype == "inlineStr":
                    value = "".join(t.text or "" for t in c.iter(f"{_S}t"))
                else:
                    v = c.find(f"{_S}v")
                    value = v.text if v is not None and v.text is not None else ""
                    if ctype == "s" and value.isdigit() and int(value) < len(shared):
                        value = shared[int(value)]
                cells[_column_index(c.get("r", ""))] = value
            if cells:
                width = max(cells) + 1
                out.append(",".join(cells.get(i, "") for i in range(width)))
    return "\n".join(out).strip()


def _pdf_text(data: bytes) -> str:
    try:
        from pypdf import PdfReader
        from pypdf.errors import PdfReadError
    except ImportError as e:
        raise ExtractionError("lettura PDF non disponibile sul server") from e
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise ExtractionError("il PDF è protetto da password")
        pages = []
        for i, page in enumerate(reader.pages):
            if i >= MAX_PDF_PAGES:
                pages.append(f"[... altre {len(reader.pages) - MAX_PDF_PAGES} pagine non lette]")
                break
            pages.append(page.extract_text() or "")
    except PdfReadError as e:
        raise ExtractionError("PDF corrotto o non valido") from e
    text = "\n\n".join(p.strip() for p in pages).strip()
    if not text:
        raise ExtractionError("il PDF non contiene testo selezionabile (probabilmente è una scansione)")
    return text


def extract_file(name: str, mime: str, data_b64: str) -> AttachedFile:
    mime = (mime or "").lower()
    if mime.startswith(IMAGE_PREFIX):
        return AttachedFile(
            name=name,
            mime=mime,
            error="è un'immagine: il modello attuale legge solo testo e non può vederne il contenuto",
        )
    try:
        data = base64.b64decode(data_b64 or "", validate=True)
    except (binascii.Error, ValueError):
        return AttachedFile(name=name, mime=mime, error="dati del file non validi")
    if not data:
        return AttachedFile(name=name, mime=mime, error="file non disponibile (troppo grande per essere letto insieme agli altri, vuoto o non scaricabile)")

    try:
        if mime in TEXT_MIMES:
            text = data.decode("utf-8", errors="replace")
        elif mime == "application/pdf":
            text = _pdf_text(data)
        elif mime == DOCX_MIME:
            text = _docx_text(data)
        elif mime == XLSX_MIME:
            text = _xlsx_text(data)
        else:
            return AttachedFile(name=name, mime=mime, error=f"formato non supportato ({mime or 'sconosciuto'})")
    except ExtractionError as e:
        return AttachedFile(name=name, mime=mime, error=str(e))
    except Exception:
        logger.exception("Unexpected extraction failure for %s (%s)", name, mime)
        return AttachedFile(name=name, mime=mime, error="impossibile leggere il file")

    if len(text) > MAX_TEXT_CHARS:
        text = text[:MAX_TEXT_CHARS] + "\n[... testo troncato]"
    return AttachedFile(name=name, mime=mime, text=text)
