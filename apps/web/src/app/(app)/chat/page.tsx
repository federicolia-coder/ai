"use client";

import { ChatMessages } from "@/components/chat-messages";
import { Composer } from "@/components/composer";
import { useChatStore } from "@/lib/store";

export default function ChatPage() {
  const { sidebarOpen, conversations, currentConversationId } = useChatStore();
  const title = conversations.find((c) => c.id === currentConversationId)?.title ?? "Nuova conversazione";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className={`flex h-14 shrink-0 items-center px-4 ${sidebarOpen ? "md:px-6" : "pl-16"}`}
        style={{ borderBottom: "1px solid var(--color-border-light)" }}
      >
        <h1 className="truncate text-sm font-semibold">{title}</h1>
      </header>

      <ChatMessages />
      <Composer />
    </div>
  );
}
