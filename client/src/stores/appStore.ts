import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface DashboardPrefs {
  showAIBriefing: boolean;
  showUrgencyStats: boolean;
  showActionItems: boolean;
  showProgramSnapshot: boolean;
  showProgramsList: boolean;
  showEscalations: boolean;
  showPMPRecommendations: boolean;
}

interface AppState {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  // Program scope
  programScope: 'mine' | 'all';
  setProgramScope: (scope: 'mine' | 'all') => void;
  // Dashboard preferences
  dashboardPrefs: DashboardPrefs;
  setDashboardPrefs: (prefs: Partial<DashboardPrefs>) => void;
  // Chat state persistence
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      // Theme — default to dark
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      // Program scope
      programScope: 'all' as const,
      setProgramScope: (programScope) => set({ programScope }),
      // Dashboard preferences — all on by default
      dashboardPrefs: {
        showAIBriefing: true,
        showUrgencyStats: true,
        showActionItems: true,
        showProgramSnapshot: true,
        showProgramsList: true,
        showEscalations: true,
        showPMPRecommendations: false,
      },
      setDashboardPrefs: (prefs) => set((state) => ({
        dashboardPrefs: { ...state.dashboardPrefs, ...prefs }
      })),
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
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        programScope: state.programScope,
        dashboardPrefs: state.dashboardPrefs,
        chatMessages: state.chatMessages
      }),
    }
  )
);
