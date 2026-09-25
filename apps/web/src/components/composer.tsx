"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/store";
import type { Message } from "@/types/database";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const ALLOWED_TYPES = new Set(Object.values(MIME_BY_EXT));
const ACCEPT = Object.keys(MIME_BY_EXT).map((e) => `.${e}`).join(",");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_MESSAGE = 5;

// Browsers often report "" or a vendor type for .md/.csv, so the extension decides.
function resolveMime(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExt = MIME_BY_EXT[ext];
  if (byExt) return byExt;
  return ALLOWED_TYPES.has(file.type) ? file.type : null;
}

interface PendingFile {
  file: File;
  mime: string;
  preview?: string;
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1h4l4 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
      <path d="M8 1v4h4" />
    </svg>
  );
}

export function Composer() {
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    currentConversationId,
    conversations,
    setConversations,
    setCurrentConversation,
    addMessage,
    setGenerating,
    isGenerating,
    setMessages,
  } = useChatStore();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const errors: string[] = [];
    const accepted: PendingFile[] = [];
    let slots = MAX_FILES_PER_MESSAGE - pendingFiles.length;

    for (const file of Array.from(files)) {
      const mime = resolveMime(file);
      if (file.type.startsWith("video/")) {
        errors.push(`${file.name}: i video non sono supportati`);
      } else if (!mime) {
        errors.push(`${file.name}: formato non supportato`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: supera i 10 MB`);
      } else if (file.size === 0) {
        errors.push(`${file.name}: il file è vuoto`);
      } else if (slots <= 0) {
        errors.push(`Massimo ${MAX_FILES_PER_MESSAGE} file per messaggio`);
        break;
      } else {
        accepted.push({
          file,
          mime,
          preview: mime.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        });
        slots--;
      }
    }
    setUploadError(errors.length ? errors.join(" · ") : null);
    setPendingFiles((prev) => [...prev, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => {
      const next = [...prev];
      if (next[index].preview) URL.revokeObjectURL(next[index].preview!);
      next.splice(index, 1);
      return next;
    });
  }

  async function uploadFiles(
    convId: string,
    userId: string,
    files: PendingFile[]
  ): Promise<{ paths: string[]; names: string[]; failed: string[] }> {
    const supabase = createClient();
    const paths: string[] = [];
    const names: string[] = [];
    const failed: string[] = [];

    for (const pf of files) {
      const ext = pf.file.name.split(".").pop()?.toLowerCase() || "bin";
      const storagePath = `${userId}/${convId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("attachments")
        .upload(storagePath, pf.file, { contentType: pf.mime });
      if (uploadErr) {
        failed.push(pf.file.name);
        continue;
      }

      const { error: rowErr } = await supabase.from("attachments").insert({
        user_id: userId,
        conversation_id: convId,
        file_name: pf.file.name,
        file_type: pf.mime,
        file_size: pf.file.size,
        storage_path: storagePath,
      });
      if (rowErr) {
        await supabase.storage.from("attachments").remove([storagePath]);
        failed.push(pf.file.name);
        continue;
      }

      paths.push(storagePath);
      names.push(pf.file.name);
    }
    return { paths, names, failed };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if ((!content && pendingFiles.length === 0) || isGenerating || uploading || content.length > 16000) return;
    setUploadError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let convId: string = currentConversationId ?? "";

    if (!convId) {
      const { data } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: (content || pendingFiles[0]?.file.name || "").slice(0, 60),
        })
        .select()
        .single();

      if (!data) return;
      convId = data.id as string;
      setCurrentConversation(convId);
      setConversations([data as any, ...conversations]);
    }

    const toUpload = pendingFiles;
    let attachmentPaths: string[] = [];
    let fileNames: string[] = [];
    if (toUpload.length > 0) {
      setUploading(true);
      const result = await uploadFiles(convId, user.id, toUpload);
      setUploading(false);
      attachmentPaths = result.paths;
      fileNames = result.names;
      toUpload.forEach((pf) => {
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      });
      setPendingFiles([]);
      if (result.failed.length > 0) {
        setUploadError(`Caricamento non riuscito: ${result.failed.join(", ")}`);
      }
      if (!content && attachmentPaths.length === 0) return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: content || `Ho allegato: ${fileNames.join(", ")}`,
      token_count: 0,
      metadata: attachmentPaths.length > 0 ? { attachments: attachmentPaths, attachment_names: fileNames } : null,
      created_at: new Date().toISOString(),
    };

    addMessage(userMsg);
    setInput("");
    setGenerating(true);

    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: userMsg.content,
      metadata: userMsg.metadata,
    });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversation_id: convId,
            message: userMsg.content,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Request failed");
      }

      const result = await response.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: convId,
        user_id: user.id,
        role: "assistant",
        content: result.content || result.message || "No response",
        token_count: result.token_count || 0,
        metadata: result.metadata || null,
        created_at: new Date().toISOString(),
      };

      addMessage(assistantMsg);
    } catch (err: any) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: convId,
        user_id: user.id,
        role: "assistant",
        content: `Errore: ${err.message || "Qualcosa e andato storto"}`,
        token_count: 0,
        metadata: null,
        created_at: new Date().toISOString(),
      };
      addMessage(errorMsg);
    } finally {
      setGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t px-4 py-3"
      style={{ borderColor: "var(--color-border-light)" }}
    >
      <div className="mx-auto max-w-2xl">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingFiles.map((pf, i) => (
              <div
                key={i}
                className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                {pf.preview ? (
                  <img
                    src={pf.preview}
                    alt={pf.file.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <span style={{ color: "var(--color-text-tertiary)" }}>
                    <FileIcon />
                  </span>
                )}
                <span className="max-w-[120px] truncate" style={{ color: "var(--color-text-secondary)" }}>
                  {pf.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Rimuovi ${pf.file.name}`}
                  className="ml-1 rounded p-0.5 transition-colors"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadError && (
          <p className="text-xs mb-2" style={{ color: "var(--color-rose)" }}>
            {uploadError}
          </p>
        )}

        <div
          className="flex items-end gap-2 rounded-xl px-4 py-2"
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating || uploading || pendingFiles.length >= MAX_FILES_PER_MESSAGE}
            className="shrink-0 inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-30"
            style={{ color: "var(--color-text-tertiary)" }}
            title="Allega file o immagine (PDF, Word, Excel, testo, CSV, JSON, immagini, max 10 MB)"
            aria-label="Allega file"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.5 9.5l-6.4 6.4a4 4 0 01-5.6-5.6l6.4-6.4a2.7 2.7 0 013.8 3.8L7.3 14.1a1.3 1.3 0 01-1.9-1.9l5.7-5.7" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            rows={1}
            maxLength={16000}
            className="flex-1 resize-none bg-transparent py-1 text-sm outline-none"
            style={{ color: "var(--color-text)" }}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || uploading || (!input.trim() && pendingFiles.length === 0)}
            className="shrink-0 inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all disabled:opacity-30"
            style={{ background: "var(--color-accent)" }}
          >
            {isGenerating || uploading ? (
              <span
                className="inline-block h-1 w-4 rounded-sm"
                style={{ background: "white", animation: "pulse-soft 1s ease-in-out infinite" }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8h12M10 4l4 4-4 4" />
              </svg>
            )}
          </button>
        </div>
        <p
          className="mt-2 text-center text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Tarry puo commettere errori. Verifica le informazioni importanti.
        </p>
      </div>
    </form>
  );
}
