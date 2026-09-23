"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/store";
import type { Message } from "@/types/database";

export function Composer() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || isGenerating) return;

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
          title: content.slice(0, 60),
        })
        .select()
        .single();

      if (!data) return;
      convId = data.id as string;
      setCurrentConversation(convId);
      setConversations([data as any, ...conversations]);
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content,
      token_count: 0,
      metadata: null,
      created_at: new Date().toISOString(),
    };

    addMessage(userMsg);
    setInput("");
    setGenerating(true);

    // Save user message
    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content,
    });

    // Call Supabase Edge Function for chat
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
            message: content,
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
        content: `Error: ${err.message || "Something went wrong"}`,
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
        <div
          className="flex items-end gap-2 rounded-xl px-4 py-2"
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            rows={1}
            className="flex-1 resize-none bg-transparent py-1 text-sm outline-none"
            style={{ color: "var(--color-text)" }}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="btn-primary shrink-0 px-3 py-1.5 text-xs"
          >
            Invia
          </button>
        </div>
        <p
          className="mt-2 text-center text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Tarry può commettere errori. Verifica le informazioni importanti.
        </p>
      </div>
    </form>
  );
}
