"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/store";
import type { Conversation } from "@/types/database";
import { ThemeToggle } from "@/components/theme-toggle";

function IconRename() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8.5 2.5l3 3M2 9.5L9.5 2l3 3L5 12.5H2v-3z" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="12" height="3" rx="1" />
      <path d="M2 5v6a1 1 0 001 1h8a1 1 0 001-1V5" />
      <path d="M5.5 8h3" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 4l6 6M10 4l-6 6" />
    </svg>
  );
}

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
      router.push("/chat");
    }
  }

  async function selectConversation(id: string) {
    setCurrentConversation(id);
    router.push("/chat");

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
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="var(--color-accent)" />
            <circle cx="11" cy="14" r="2.5" fill="white" />
            <circle cx="11.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
            <circle cx="21" cy="14" r="2.5" fill="var(--color-violet)" />
            <circle cx="21.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
            <path d="M11 21c2.5 3 7.5 3 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">Tarry</span>
        </div>
        <button
          onClick={createConversation}
          className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-xs font-medium transition-colors"
          style={{ color: "var(--color-accent-text)" }}
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
                  ? "var(--color-accent-soft)"
                  : "transparent",
              color:
                currentConversationId === c.id
                  ? "var(--color-accent-text)"
                  : "var(--color-text)",
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
            <div className="ml-2 hidden items-center gap-0.5 group-hover:flex" style={{ color: "var(--color-text-tertiary)" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(c.id);
                  setEditTitle(c.title);
                }}
                className="hover:opacity-100 opacity-60 p-0.5 transition-opacity"
                aria-label="Rename"
                title="Rinomina"
              >
                <IconRename />
              </button>
              <button
                onClick={(e) => archiveConversation(c.id, e)}
                className="hover:opacity-100 opacity-60 p-0.5 transition-opacity"
                aria-label="Archive"
                title="Archivia"
              >
                <IconArchive />
              </button>
              <button
                onClick={(e) => deleteConversation(c.id, e)}
                className="hover:opacity-100 opacity-60 p-0.5 transition-opacity"
                aria-label="Delete"
                title="Elimina"
                style={{ color: "var(--color-rose)" }}
              >
                <IconDelete />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              Nessuna conversazione
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="border-t px-3 py-3 space-y-0.5"
        style={{ borderColor: "var(--color-border-light)" }}
      >
        <button
          onClick={() => router.push("/chat")}
          className="btn-ghost w-full justify-start text-xs gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V3z" />
          </svg>
          Chat
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-ghost w-full justify-start text-xs gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
          </svg>
          Dashboard
        </button>
        <button
          onClick={() => router.push("/plugins")}
          className="btn-ghost w-full justify-start text-xs gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="10" height="10" rx="2" />
            <circle cx="8" cy="8" r="2" />
          </svg>
          Plugin
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="btn-ghost w-full justify-start text-xs gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 2v2M8 12v2M2 8h2M12 8h2M3.8 3.8l1.4 1.4M10.8 10.8l1.4 1.4M3.8 12.2l1.4-1.4M10.8 5.2l1.4-1.4" />
          </svg>
          Impostazioni
        </button>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="btn-ghost w-full justify-start text-xs gap-2"
          style={{ color: "var(--color-rose)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" />
            <path d="M10 11l3-3-3-3" />
            <path d="M13 8H6" />
          </svg>
          Esci
        </button>
      </div>
    </aside>
  );
}
