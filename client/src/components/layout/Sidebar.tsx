import { Link, useLocation } from "wouter";
import {
  ChartGantt,
  TrendingUp,
  BarChart3,
  Settings,
  Activity,
  Brain,
  ChevronLeft,
  ChevronRight,
  Users,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserButton, useUser } from "@clerk/clerk-react";

const CLERK_ENABLED = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const navigationItems = [
  { path: "/", icon: Activity, label: "Home", group: "core" },
  { path: "/ai", icon: Brain, label: "AI Assistant", group: "core" },
  { path: "/programs", icon: ChartGantt, label: "Programs", group: "manage" },
  { path: "/people", icon: Users, label: "People", group: "manage" },
  { path: "/escalations", icon: TrendingUp, label: "Escalations", group: "track" },
  { path: "/executive-reports", icon: BarChart3, label: "Reports", group: "track" },
];

const groupLabels: Record<string, string> = {
  core: "Overview",
  manage: "Management",
  track: "Tracking",
};

function SidebarUserInfo() {
  const { user } = useUser();
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium text-gray-200 truncate">
        {user?.fullName || user?.primaryEmailAddress?.emailAddress || "User"}
      </p>
      <p className="text-[11px] text-gray-500 truncate">
        {user?.primaryEmailAddress?.emailAddress || ""}
      </p>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Group navigation items
  const groups = ["core", "manage", "track"];

  const NavItem = ({ item }: { item: typeof navigationItems[0] }) => {
    const isActive = location === item.path;
    const content = (
      <Link
        href={item.path}
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-2 py-2.5 mx-1' : 'px-3 py-2 mx-2'} rounded-lg transition-all duration-200 group relative ${
          isActive
            ? "bg-white/10 text-white shadow-sm shadow-white/5"
            : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-blue-400" />
        )}
        <item.icon size={18} className={`flex-shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-gray-300'}`} />
        {!isCollapsed && (
          <span className={`text-[13px] ${isActive ? "font-medium" : "font-normal"}`}>{item.label}</span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800 text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  return (
    <div className={`${isCollapsed ? 'w-[60px]' : 'w-[240px]'} bg-gray-950 flex flex-col h-full transition-all duration-300 ease-in-out relative border-r border-white/[0.06]`}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 z-10 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-300" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-300" />
        )}
      </button>

      {/* Logo */}
      <div className={`${isCollapsed ? 'px-2 py-4' : 'px-4 py-5'} border-b border-white/[0.06]`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Sparkles className="text-white" size={16} />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">TPM Platform</h1>
              <p className="text-[11px] text-gray-500 font-medium">Program Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-3 overflow-y-auto custom-scrollbar">
        {groups.map((group) => {
          const items = navigationItems.filter(i => i.group === group);
          return (
            <div key={group} className="mb-1">
              {!isCollapsed && (
                <div className="px-5 py-2">
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                    {groupLabels[group]}
                  </span>
                </div>
              )}
              {isCollapsed && group !== "core" && (
                <div className="mx-3 my-2 border-t border-white/[0.06]" />
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            </div>
          );
        })}

      </nav>

      {/* Settings */}
      <div className="border-t border-white/[0.06]">
        <Link
          href="/settings"
          className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-5 py-3'} text-gray-400 hover:text-gray-200 transition-colors`}
        >
          <Settings size={16} />
          {!isCollapsed && <span className="text-[13px] font-medium">Settings</span>}
        </Link>
      </div>

      {/* User Profile + Sign Out */}
      {CLERK_ENABLED && (
        <div className={`${isCollapsed ? 'p-2' : 'px-3 pb-4 pt-2'} border-t border-white/[0.06]`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            {!isCollapsed && <SidebarUserInfo />}
          </div>
        </div>
      )}
    </div>
  );
}
