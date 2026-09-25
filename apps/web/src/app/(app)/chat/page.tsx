"use client";

import { ChatMessages } from "@/components/chat-messages";
import { Composer } from "@/components/composer";
import { useChatStore } from "@/lib/store";

export default function ChatPage() {
  const { toggleSidebar } = useChatStore();

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <header
        className="flex items-center gap-3 border-b px-4 py-2.5"
        style={{ borderColor: "var(--color-border-light)" }}
      >
        <button onClick={toggleSidebar} className="btn-ghost px-2 py-1 text-sm">
          &#9776;
        </button>
        <span className="text-sm font-medium">Chat</span>
      </header>

      <ChatMessages />
      <Composer />
    </div>
  );
}
