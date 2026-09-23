"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/store";
import type { Conversation } from "@/types/database";
import { ThemeToggle } from "@/components/theme-toggle";

export function Sidebar() {
  const router = useRouter();
  const {
    conversations,
    setConversations,
    currentConversationId,
    setCurrentConversation,
    setMessages,
    sidebarOpen,
  } = useChatStore();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("archived", false)
      .order("updated_at", { ascending: false });

    if (data) setConversations(data as Conversation[]);
  }

  async function createConversation() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New conversation" })
      .select()
      .single();

    if (data) {
      setConversations([data as Conversation, ...conversations]);
      setCurrentConversation(data.id as string);
      setMessages([]);
    }
  }

  async function selectConversation(id: string) {
    setCurrentConversation(id);

    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (data) setMessages(data as any);
  }

  async function renameConversation(id: string) {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    const supabase = createClient();
    await supabase
      .from("conversations")
      .update({ title: editTitle.trim() })
      .eq("id", id);

    setConversations(
      conversations.map((c) =>
        c.id === id ? { ...c, title: editTitle.trim() } : c
      )
    );
    setEditingId(null);
  }

  async function archiveConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = createClient();
    await supabase
      .from("conversations")
      .update({ archived: true })
      .eq("id", id);

    setConversations(conversations.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = createClient();
    await supabase.from("conversations").delete().eq("id", id);
    setConversations(conversations.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!sidebarOpen) return null;

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-r"
      style={{
        background: "var(--color-bg-secondary)",
        borderColor: "var(--color-border-light)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-border-light)" }}
      >
        <span className="text-sm font-semibold tracking-tight">Tarry</span>
        <button
          onClick={createConversation}
          className="btn-ghost px-2 py-1 text-xs"
        >
          + Nuova
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="Cerca..."
          className="input-field text-xs py-1.5"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => selectConversation(c.id)}
            className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer"
            style={{
              background:
                currentConversationId === c.id
                  ? "var(--color-bg-tertiary)"
                  : "transparent",
              color: "var(--color-text)",
            }}
          >
            {editingId === c.id ? (
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => renameConversation(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") renameConversation(c.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate flex-1">{c.title}</span>
            )}
            <div className="ml-2 hidden items-center gap-0.5 group-hover:flex">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(c.id);
                  setEditTitle(c.title);
                }}
                className="text-xs opacity-50 hover:opacity-100 px-0.5"
                aria-label="Rename"
                title="Rinomina"
              >
                &#9998;
              </button>
              <button
                onClick={(e) => archiveConversation(c.id, e)}
                className="text-xs opacity-50 hover:opacity-100 px-0.5"
                aria-label="Archive"
                title="Archivia"
              >
                &#128230;
              </button>
              <button
                onClick={(e) => deleteConversation(c.id, e)}
                className="text-xs opacity-50 hover:opacity-100 px-0.5"
                aria-label="Delete"
                title="Elimina"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p
            className="px-3 py-4 text-xs text-center"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Nessuna conversazione
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="border-t px-3 py-3 space-y-1"
        style={{ borderColor: "var(--color-border-light)" }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-ghost w-full justify-start text-xs"
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push("/plugins")}
          className="btn-ghost w-full justify-start text-xs"
        >
          Plugin
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="btn-ghost w-full justify-start text-xs"
        >
          Impostazioni
        </button>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="btn-ghost w-full justify-start text-xs"
          style={{ color: "var(--color-danger)" }}
        >
          Esci
        </button>
      </div>
    </aside>
  );
}
