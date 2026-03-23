import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Moon, Sun, Search } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { GlobalSearch } from "./GlobalSearch";

interface HeaderProps {
  title: string;
  subtitle: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
  newButtonText?: string;
  actions?: React.ReactNode;
  showScopeToggle?: boolean;
}

export function Header({ title, subtitle, showNewButton = true, onNewClick, newButtonText = "New Program", actions, showScopeToggle = false }: HeaderProps) {
  const { theme, toggleTheme, programScope, setProgramScope } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/60 dark:border-white/[0.06] px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            {showScopeToggle && (
              <div className="flex items-center bg-gray-100 dark:bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setProgramScope('mine')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    programScope === 'mine'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  My Programs
                </button>
                <button
                  onClick={() => setProgramScope('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    programScope === 'all'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  All Programs
                </button>
              </div>
            )}
            <button
              onClick={handleOpenSearch}
              className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
              title="Search (Cmd+K)"
            >
              <Search className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-100 dark:bg-white/10 rounded border border-gray-200 dark:border-white/10">
                <span className="text-[10px]">&#8984;</span>K
              </kbd>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-gray-600" />
              )}
            </button>
            {showNewButton && (
              <Button
                onClick={onNewClick}
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all"
              >
                <Plus size={15} className="mr-1.5" />
                {newButtonText}
              </Button>
            )}
          </div>
        </div>
      </header>
      <GlobalSearch isOpen={searchOpen} onClose={handleCloseSearch} />
    </>
  );
}
