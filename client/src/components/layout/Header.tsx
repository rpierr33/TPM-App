import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
  newButtonText?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, showNewButton = true, onNewClick, newButtonText = "New Program", actions }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {actions}
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
