"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  ChatCircle,
  GearSix,
  MagnifyingGlass,
  PencilSimple,
  Plug,
  PlugsConnected,
  Plus,
  SidebarSimple,
  SignOut,
  SquaresFour,
  Trash,
} from "@phosphor-icons/react";
import { TarryMark } from "@/components/tarry-mark";
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
    setSidebarOpen,
  } = useChatStore();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadConversations();
    if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeOnMobile() {
    if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false);
  }

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
      closeOnMobile();
    }
  }

  async function selectConversation(id: string) {
    setCurrentConversation(id);
    router.push("/chat");
    closeOnMobile();

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
    if (!window.confirm("Eliminare questa conversazione? Non si può annullare.")) return;
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

  const NAV = [
    { href: "/chat", label: "Chat", icon: ChatCircle },
    { href: "/dashboard", label: "Utilizzo", icon: SquaresFour },
    { href: "/plugins", label: "Plugin", icon: Plug },
    { href: "/connectors", label: "Connettori", icon: PlugsConnected },
    { href: "/settings", label: "Impostazioni", icon: GearSix },
  ];

  if (!sidebarOpen) {
    return (
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="btn-secondary fixed left-3 top-3 z-40 h-9 w-9 p-0"
        aria-label="Apri la barra laterale"
      >
        <SidebarSimple size={18} />
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-30 md:hidden"
        style={{ background: "rgb(0 0 0 / 0.4)" }}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col md:static md:z-auto md:w-64"
        style={{
          background: "var(--color-bg-secondary)",
          borderRight: "1px solid var(--color-border-light)",
        }}
        aria-label="Barra laterale"
      >
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-1" aria-label="Tarry, pagina iniziale">
            <TarryMark size={24} />
            <span className="text-base font-semibold tracking-tight">Tarry</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="btn-ghost h-9 w-9 p-0"
            aria-label="Chiudi la barra laterale"
          >
            <SidebarSimple size={18} />
          </button>
        </div>

        <div className="space-y-2 px-3">
          <button type="button" onClick={createConversation} className="btn-primary w-full text-sm">
            <Plus size={16} weight="bold" aria-hidden="true" />
            Nuova conversazione
          </button>
          <div className="relative">
            <MagnifyingGlass
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-tertiary)" }}
            />
            <input
              type="search"
              placeholder="Cerca nelle conversazioni"
              aria-label="Cerca nelle conversazioni"
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <nav aria-label="Conversazioni" className="mt-4 flex-1 overflow-y-auto px-3">
          <ul className="space-y-0.5">
            {filtered.map((c) => {
              const active = currentConversationId === c.id && pathname === "/chat";
              return (
                <li key={c.id} className="group relative">
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      aria-label="Nuovo titolo"
                      className="input-field"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => renameConversation(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameConversation(c.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectConversation(c.id)}
                      aria-current={active ? "page" : undefined}
                      className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 group-focus-within:pr-24 group-hover:pr-24 max-md:pr-24"
                      style={{
                        background: active ? "var(--color-surface)" : "transparent",
                        color: active ? "var(--color-text)" : "var(--color-text-secondary)",
                        fontWeight: active ? 600 : 500,
                        boxShadow: active ? "var(--shadow-raised)" : "none",
                      }}
                    >
                      {c.title}
                    </button>
                  )}
                  {editingId !== c.id && (
                    <div
                      className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditTitle(c.title);
                        }}
                        className="rounded-md p-1.5 hover:text-[var(--color-text)]"
                        aria-label={`Rinomina ${c.title}`}
                        title="Rinomina"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => archiveConversation(c.id, e)}
                        className="rounded-md p-1.5 hover:text-[var(--color-text)]"
                        aria-label={`Archivia ${c.title}`}
                        title="Archivia"
                      >
                        <Archive size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => deleteConversation(c.id, e)}
                        className="rounded-md p-1.5 hover:text-[var(--color-rose)]"
                        aria-label={`Elimina ${c.title}`}
                        title="Elimina"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              {search ? "Nessuna conversazione trovata." : "Le tue conversazioni appariranno qui."}
            </p>
          )}
        </nav>

        <nav aria-label="Sezioni" className="space-y-0.5 px-3 py-3" style={{ borderTop: "1px solid var(--color-border-light)" }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={closeOnMobile}
                aria-current={active ? "page" : undefined}
                className="btn-ghost w-full justify-start rounded-lg text-sm"
                style={active ? { background: "var(--color-surface)", color: "var(--color-text)" } : undefined}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
          <ThemeToggle />
          <button type="button" onClick={handleLogout} className="btn-ghost w-full justify-start rounded-lg text-sm">
            <SignOut size={18} aria-hidden="true" />
            Esci
          </button>
        </nav>
      </aside>
    </>
  );
}
