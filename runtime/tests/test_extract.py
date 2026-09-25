import base64
import io
import zipfile

from runtime.plugins import extract
from runtime.plugins.extract import DOCX_MIME, XLSX_MIME, extract_file


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def make_zip(files: dict[str, str]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for name, content in files.items():
            zf.writestr(name, content)
    return buf.getvalue()


def make_pdf(text: str) -> bytes:
    stream = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = io.BytesIO()
    out.write(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objects, 1):
        offsets.append(out.tell())
        out.write(f"{i} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = out.tell()
    out.write(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for off in offsets:
        out.write(f"{off:010d} 00000 n \n".encode())
    out.write(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return out.getvalue()


W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
S = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'


def test_plain_text_utf8():
    f = extract_file("a.txt", "text/plain", b64("città è bella".encode()))
    assert f.text == "città è bella"
    assert not f.error


def test_image_is_reported_not_read():
    f = extract_file("photo.png", "image/png", b64(b"\x89PNG"))
    assert f.error and "immagine" in f.error
    assert f.text == ""


def test_invalid_base64():
    assert extract_file("a.txt", "text/plain", "@@not base64@@").error


def test_empty_file():
    assert extract_file("a.txt", "text/plain", "").error


def test_unsupported_mime():
    f = extract_file("a.bin", "application/octet-stream", b64(b"abc"))
    assert "non supportato" in f.error


def test_docx():
    doc = f'<w:document {W}><w:body><w:p><w:r><w:t>Primo</w:t></w:r><w:r><w:t xml:space="preserve"> paragrafo</w:t></w:r></w:p><w:p><w:r><w:t>Secondo</w:t></w:r></w:p></w:body></w:document>'
    f = extract_file("doc.docx", DOCX_MIME, b64(make_zip({"word/document.xml": doc})))
    assert f.text == "Primo paragrafo\nSecondo"


def test_docx_that_is_not_a_zip():
    assert "corrotto" in extract_file("doc.docx", DOCX_MIME, b64(b"plain text")).error


def test_xlsx_shared_and_inline_strings_with_gaps():
    shared = f'<sst {S}><si><t>Nome</t></si><si><t>Età</t></si><si><t>Anna</t></si></sst>'
    sheet = (
        f'<worksheet {S}><sheetData>'
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>'
        '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="C2"><v>30</v></c></row>'
        '<row r="3"><c r="A3" t="inlineStr"><is><t>Luca</t></is></c></row>'
        '</sheetData></worksheet>'
    )
    data = make_zip({"xl/sharedStrings.xml": shared, "xl/worksheets/sheet1.xml": sheet})
    f = extract_file("t.xlsx", XLSX_MIME, b64(data))
    assert f.text.splitlines() == ["## Foglio 1", "Nome,Età", "Anna,,30", "Luca"]


def test_zip_bomb_guard(monkeypatch):
    monkeypatch.setattr(extract, "MAX_DECOMPRESSED_BYTES", 100)
    data = make_zip({"word/document.xml": "a" * 1000})
    assert "decompresso" in extract_file("d.docx", DOCX_MIME, b64(data)).error


def test_pdf_text():
    f = extract_file("r.pdf", "application/pdf", b64(make_pdf("Fattura numero 42")))
    assert not f.error, f.error
    assert "Fattura numero 42" in f.text


def test_pdf_corrupted():
    f = extract_file("r.pdf", "application/pdf", b64(b"%PDF-1.4 garbage"))
    assert f.error


def test_long_text_is_truncated(monkeypatch):
    monkeypatch.setattr(extract, "MAX_TEXT_CHARS", 10)
    f = extract_file("a.txt", "text/plain", b64(b"x" * 50))
    assert f.text.startswith("x" * 10) and "troncato" in f.text
