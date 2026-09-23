import { create } from "zustand";
import type { Conversation, Message } from "@/types/database";

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isGenerating: boolean;
  sidebarOpen: boolean;

  setConversations: (c: Conversation[]) => void;
  setCurrentConversation: (id: string | null) => void;
  setMessages: (m: Message[]) => void;
  addMessage: (m: Message) => void;
  updateLastAssistantMessage: (content: string) => void;
  setGenerating: (v: boolean) => void;
  toggleSidebar: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isGenerating: false,
  sidebarOpen: true,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  updateLastAssistantMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content };
      }
      return { messages: msgs };
    }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
