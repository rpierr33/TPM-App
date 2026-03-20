import { Button } from "@/components/ui/button";
import { Plus, Moon, Sun } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

interface HeaderProps {
  title: string;
  subtitle: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
  newButtonText?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, showNewButton = true, onNewClick, newButtonText = "New Program", actions }: HeaderProps) {
  const { theme, toggleTheme } = useAppStore();

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/60 dark:border-white/[0.06] px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {actions}
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
  );
}
