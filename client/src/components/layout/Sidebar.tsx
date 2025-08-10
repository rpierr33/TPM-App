import { Link, useLocation } from "wouter";
import { useMode } from "@/hooks/useMode";
import { Button } from "@/components/ui/button";
import { 
  ChartGantt, 
  ClipboardList, 
  Flag, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  BarChart3,
  Settings,
  Activity,
  Brain,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const navigationItems = [
  { path: "/", icon: Brain, label: "AI Assistant" },
  { path: "/dashboard", icon: Activity, label: "Dashboard" },
  { path: "/milestones", icon: Flag, label: "Milestones" },
  { path: "/risk-management", icon: AlertTriangle, label: "Risk Management" },
  { path: "/dependencies", icon: ChartGantt, label: "Dependencies" },
  { path: "/adopter-support", icon: Users, label: "Adopter Support" },
  { path: "/escalations", icon: TrendingUp, label: "Escalations" },
  { path: "/executive-reports", icon: BarChart3, label: "Executive Reports" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { mode, toggleMode, isTestMode } = useMode();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check localStorage for saved collapse state
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save collapse state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const { data: integrations } = useQuery({
    queryKey: ["/api/integrations"],
    enabled: !isTestMode, // Only fetch in live mode
  });

  const getIntegrationStatus = (name: string) => {
    if (isTestMode) {
      // Mock statuses for test mode
      const mockStatuses: Record<string, string> = {
        jira: "connected",
        smartsheet: "connected", 
        confluence: "limited",
        slack: "connected",
        teams: "disconnected"
      };
      return mockStatuses[name] || "disconnected";
    }
    
    const integration = Array.isArray(integrations) ? integrations.find((i: any) => i.name === name) : undefined;
    return integration?.status || "disconnected";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-success";
      case "limited": return "bg-warning";
      case "error": return "bg-danger";
      default: return "bg-gray-300";
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg flex flex-col h-full transition-all duration-300 relative`}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-600" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-600" />
        )}
      </button>

      {/* Logo and Mode Toggle */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-200`}>
        <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ChartGantt className="text-white text-lg" size={20} />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">TPM Platform</h1>
              <p className="text-sm text-gray-500">Program Management</p>
            </div>
          )}
        </div>
        
        {/* Mode Toggle */}
        {!isCollapsed && (
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <div className="flex bg-white rounded-md p-1">
              <Button
                variant={isTestMode ? "default" : "ghost"}
                size="sm"
                onClick={() => !isTestMode && toggleMode()}
                className={`px-3 py-1 text-sm font-medium ${
                  isTestMode 
                    ? "bg-primary-500 text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Test
              </Button>
              <Button
                variant={!isTestMode ? "default" : "ghost"}
                size="sm"
                onClick={() => isTestMode && toggleMode()}
                className={`px-3 py-1 text-sm font-medium ${
                  !isTestMode 
                    ? "bg-primary-500 text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Live
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon size={20} />
                  {!isCollapsed && (
                    <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Integration Status */}
        {!isCollapsed && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Integration Status</h3>
            <div className="space-y-2">
              {["jira", "smartsheet", "confluence", "slack", "teams"].map((integration) => (
                <div key={integration} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 capitalize">{integration}</span>
                  <span 
                    className={`w-2 h-2 rounded-full ${getStatusColor(getIntegrationStatus(integration))}`}
                    title={getIntegrationStatus(integration)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
            alt="User Profile" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Sarah Chen</p>
            <p className="text-xs text-gray-500">Senior TPM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
