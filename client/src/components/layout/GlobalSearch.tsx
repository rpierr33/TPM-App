import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  Search,
  X,
  Briefcase,
  Target,
  AlertTriangle,
  AlertCircle,
  Users,
  Link2,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  programName: string | null;
  matchField: string;
}

interface SearchResults {
  programs: SearchResult[];
  milestones: SearchResult[];
  risks: SearchResult[];
  escalations: SearchResult[];
  stakeholders: SearchResult[];
  dependencies: SearchResult[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Briefcase; color: string }> = {
  program: { label: "Programs", icon: Briefcase, color: "text-blue-600" },
  milestone: { label: "Milestones", icon: Target, color: "text-green-600" },
  risk: { label: "Risks", icon: AlertTriangle, color: "text-red-600" },
  escalation: { label: "Escalations", icon: AlertCircle, color: "text-orange-600" },
  stakeholder: { label: "Stakeholders", icon: Users, color: "text-purple-600" },
  dependency: { label: "Dependencies", icon: Link2, color: "text-cyan-600" },
};

function getNavigationPath(result: SearchResult): string {
  switch (result.type) {
    case "program":
      return `/programs/${result.id}`;
    case "milestone":
      return "/milestones";
    case "risk":
      return "/risk-management";
    case "escalation":
      return "/escalations";
    case "stakeholder":
      return "/stakeholders";
    case "dependency":
      return "/dependencies";
    default:
      return "/dashboard";
  }
}

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setLocation] = useLocation();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiRequest(`/api/search?q=${encodeURIComponent(searchQuery)}`, "GET");
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleResultClick = (result: SearchResult) => {
    setLocation(getNavigationPath(result));
    onClose();
  };

  const allResultGroups = results
    ? (Object.entries(results) as [string, SearchResult[]][])
        .filter(([, items]) => items.length > 0)
    : [];

  const totalResults = allResultGroups.reduce((sum, [, items]) => sum + items.length, 0);

  // Map group keys to type keys
  const groupTypeMap: Record<string, string> = {
    programs: "program",
    milestones: "milestone",
    risks: "risk",
    escalations: "escalation",
    stakeholders: "stakeholder",
    dependencies: "dependency",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden mx-4">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs, milestones, risks, stakeholders..."
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && query && results && totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="h-8 w-8 mb-2 text-gray-300" />
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}

          {!isLoading && allResultGroups.map(([groupKey, items]) => {
            const typeKey = groupTypeMap[groupKey] || groupKey;
            const config = TYPE_CONFIG[typeKey];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <div key={groupKey}>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {config.label} ({items.length})
                  </span>
                </div>
                {items.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleResultClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.programName && (
                          <span className="text-xs text-gray-500 truncate">{item.programName}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          matched on {item.matchField}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}

          {!isLoading && !query && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="h-8 w-8 mb-2 text-gray-300" />
              <p className="text-sm">Type to search across all data</p>
              <p className="text-xs mt-1">Programs, milestones, risks, stakeholders, and more</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {totalResults > 0 ? `${totalResults} result${totalResults !== 1 ? "s" : ""}` : ""}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Enter</kbd>
            <span>to select</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Esc</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
