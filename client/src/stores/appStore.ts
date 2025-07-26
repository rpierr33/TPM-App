import { create } from 'zustand';

export type AppMode = 'test' | 'live';

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'test', // Default to test mode
  setMode: (mode) => set({ mode }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
