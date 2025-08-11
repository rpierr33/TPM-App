import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppMode = 'test' | 'live';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  responseType?: 'text' | 'image' | 'file' | 'action' | 'success' | 'error';
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
  actions?: {
    type: 'navigate' | 'create' | 'update' | 'delete';
    target: string;
    data?: any;
  }[];
  createdItems?: {
    type: 'program' | 'risk' | 'milestone' | 'adopter' | 'dependency';
    id: string;
    name: string;
  }[];
}

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Chat state persistence
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      mode: 'test', // Default to test mode
      setMode: (mode) => set({ mode }),
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      // Chat state persistence
      chatMessages: [
        {
          id: '1',
          type: 'ai',
          content: 'Hello! I\'m your AI assistant for program management. I can help you create programs, add risks, create milestones, analyze data, and perform any action you can do manually. Just tell me what you need!',
          timestamp: new Date(),
          responseType: 'text'
        }
      ],
      setChatMessages: (messages) => set({ chatMessages: messages }),
      addChatMessage: (message) => set((state) => ({ 
        chatMessages: [...state.chatMessages, message] 
      })),
      clearChatHistory: () => set({ 
        chatMessages: [
          {
            id: '1',
            type: 'ai',
            content: 'Hello! I\'m your AI assistant for program management. I can help you create programs, add risks, create milestones, analyze data, and perform any action you can do manually. Just tell me what you need!',
            timestamp: new Date(),
            responseType: 'text'
          }
        ] 
      }),
    }),
    {
      name: 'tpm-app-storage',
      partialize: (state) => ({ 
        mode: state.mode,
        sidebarCollapsed: state.sidebarCollapsed,
        chatMessages: state.chatMessages 
      }),
    }
  )
);
