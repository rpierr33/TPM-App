import { Button } from "@/components/ui/button";
import { Plus, FlaskConical } from "lucide-react";
import { useMode } from "@/hooks/useMode";

interface HeaderProps {
  title: string;
  subtitle: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
}

export function Header({ title, subtitle, showNewButton = true, onNewClick }: HeaderProps) {
  const { isTestMode } = useMode();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Test Mode Indicator */}
          {isTestMode && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              <FlaskConical size={14} />
              <span className="text-sm font-medium">Test Mode Active</span>
            </div>
          )}
          {showNewButton && (
            <Button 
              onClick={onNewClick}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <Plus size={16} />
              <span>New Program</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
