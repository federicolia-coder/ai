"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/store";
import type { Message } from "@/types/database";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PendingFile {
  file: File;
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
    setUploadError(null);

    const newFiles: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith("video/")) {
        setUploadError("I video non sono supportati.");
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`Tipo non supportato: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File troppo grande (max 10MB): ${file.name}`);
        continue;
      }
      const pf: PendingFile = { file };
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        pf.preview = URL.createObjectURL(file);
      }
      newFiles.push(pf);
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
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

  async function uploadFiles(convId: string, userId: string): Promise<string[]> {
    const supabase = createClient();
    const paths: string[] = [];

    for (const pf of pendingFiles) {
      const ext = pf.file.name.split(".").pop() || "bin";
      const storagePath = `${userId}/${convId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("attachments")
        .upload(storagePath, pf.file, { contentType: pf.file.type });

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      await supabase.from("attachments").insert({
        user_id: userId,
        conversation_id: convId,
        file_name: pf.file.name,
        file_type: pf.file.type,
        file_size: pf.file.size,
        storage_path: storagePath,
      });

      paths.push(storagePath);
    }
    return paths;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if ((!content && pendingFiles.length === 0) || isGenerating || content.length > 16000) return;

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

    let attachmentPaths: string[] = [];
    if (pendingFiles.length > 0) {
      attachmentPaths = await uploadFiles(convId, user.id);
      pendingFiles.forEach((pf) => {
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      });
      setPendingFiles([]);
    }

    const fileNames = attachmentPaths.length > 0
      ? pendingFiles.map((pf) => pf.file.name)
      : [];

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: content || (fileNames.length > 0 ? `[${fileNames.join(", ")}]` : ""),
      token_count: 0,
      metadata: attachmentPaths.length > 0 ? { attachments: attachmentPaths } : null,
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

  const acceptTypes = ALLOWED_TYPES.join(",");

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
            accept={acceptTypes}
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="shrink-0 inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-30"
            style={{ color: "var(--color-text-tertiary)" }}
            title="Allega file o immagine"
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
            disabled={isGenerating || (!input.trim() && pendingFiles.length === 0)}
            className="shrink-0 inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all disabled:opacity-30"
            style={{ background: "var(--color-accent)" }}
          >
            {isGenerating ? (
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
