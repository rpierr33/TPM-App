import { useAppStore } from '@/stores/appStore';

export function useMode() {
  const { mode, setMode } = useAppStore();
  
  const isTestMode = mode === 'test';
  const isLiveMode = mode === 'live';
  
  const toggleMode = () => {
    setMode(mode === 'test' ? 'live' : 'test');
  };
  
  return {
    mode,
    isTestMode,
    isLiveMode,
    setMode,
    toggleMode,
  };
}
