import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useAppStore } from "@/stores/appStore";
import {
  Sparkles,
  AlertTriangle,
  Calendar,
  ArrowRight,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

interface PriorityItem {
  type: string;
  id: string;
  title: string;
  programId: string;
  programName: string;
  dueDate: string;
  daysOverdue?: number;
  daysUntilDue?: number;
  severity?: string;
}

interface DashboardPriorities {
  overdue: PriorityItem[];
  dueThisWeek: PriorityItem[];
  criticalRisks: Array<{ id: string; title: string; severity: string; status: string; programId: string; programName: string }>;
  blockedDependencies: Array<{ id: string; title: string; status: string; programId: string; programName: string }>;
  programUrgencyScores: Array<{ programId: string; programName: string; score: number; overdueCount: number; criticalRiskCount: number; blockedDepCount: number }>;
}

interface AIBriefing {
  summary: string;
  priorities: string[];
  alerts: string[];
  recommendations: string[];
}

export function TodaysFocus() {
  const [, setLocation] = useLocation();
  const [showAllItems, setShowAllItems] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [briefingExpanded, setBriefingExpanded] = useState(false);
  const { dashboardPrefs, setDashboardPrefs } = useAppStore();

  const { data: priorities } = useQuery<DashboardPriorities>({
    queryKey: ["/api/dashboard/priorities"],
  });

  const { data: briefing, isLoading: briefingLoading } = useQuery<AIBriefing>({
    queryKey: ["/api/ai/daily-briefing"],
    staleTime: 10 * 60 * 1000,
    enabled: dashboardPrefs.showAIBriefing,
  });

  const overdueCount = priorities?.overdue?.length ?? 0;
  const dueThisWeekCount = priorities?.dueThisWeek?.length ?? 0;
  const blockedCount = priorities?.blockedDependencies?.length ?? 0;
  const criticalCount = priorities?.criticalRisks?.length ?? 0;
  const totalActionItems = overdueCount + dueThisWeekCount;

  const actionItems: Array<PriorityItem & { urgency: 'overdue' | 'due-today' | 'this-week' }> = [];
  if (priorities?.overdue) {
    for (const item of priorities.overdue) actionItems.push({ ...item, urgency: 'overdue' });
  }
  if (priorities?.dueThisWeek) {
    for (const item of priorities.dueThisWeek) {
      actionItems.push({ ...item, urgency: item.daysUntilDue === 0 ? 'due-today' : 'this-week' });
    }
  }

  const visibleItems = showAllItems ? actionItems : actionItems.slice(0, 8);

  const settingsItems = [
    { key: 'showAIBriefing' as const, label: 'AI Daily Briefing', desc: 'AI-generated portfolio summary and priorities' },
    { key: 'showUrgencyStats' as const, label: 'Urgency Stats', desc: 'Overdue, due this week, and critical risk counts' },
    { key: 'showActionItems' as const, label: 'Action Items List', desc: 'Sequenced list of upcoming milestones and risks' },
    { key: 'showProgramSnapshot' as const, label: 'Program Snapshot', desc: 'Metrics cards (active programs, risks, etc.)' },
    { key: 'showProgramsList' as const, label: 'Programs List', desc: 'Full program cards sorted by urgency' },
    { key: 'showEscalations' as const, label: 'Escalations & Reports', desc: 'Open escalations and generated reports' },
    { key: 'showPMPRecommendations' as const, label: 'PMP Recommendations', desc: 'PMI/PMP best practice recommendations' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Settings Panel */}
      {showSettings && (
        <Card className="border border-gray-200/80 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Customize Dashboard</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">Choose which sections appear on your dashboard. Preferences are saved automatically.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {settingsItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 mr-3">
                    <p className="text-[12px] font-medium text-gray-900">{item.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                  </div>
                  <Switch
                    checked={dashboardPrefs[item.key]}
                    onCheckedChange={(checked) => setDashboardPrefs({ [item.key]: checked })}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with settings gear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Target className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Today's Focus</h2>
            <p className="text-[10px] text-gray-400">What needs your attention right now</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded-lg border transition-colors ${showSettings ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          title="Customize dashboard"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 1. ACTION ITEMS — Hero Section (first thing you see) */}
      {dashboardPrefs.showActionItems && totalActionItems > 0 && (
        <Card className="border border-gray-200/80 shadow-sm bg-white">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900">This Week's Action Items</h3>
                <Badge className="bg-blue-50 text-blue-700 text-[10px]">{totalActionItems}</Badge>
              </div>
              {blockedCount > 0 && (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                  <GitBranch className="h-2.5 w-2.5 mr-1" />
                  {blockedCount} blocked
                </Badge>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {visibleItems.map((item, i) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors group cursor-pointer"
                  onClick={() => {
                    if (item.type === 'milestone') setLocation('/milestones');
                    else if (item.type === 'risk') setLocation('/risk-management');
                  }}
                >
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>

                  {item.urgency === 'overdue' && (
                    <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0 flex-shrink-0">
                      {item.daysOverdue}d overdue
                    </Badge>
                  )}
                  {item.urgency === 'due-today' && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 flex-shrink-0">
                      Due today
                    </Badge>
                  )}
                  {item.urgency === 'this-week' && (
                    <Badge className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0 flex-shrink-0">
                      {item.daysUntilDue}d left
                    </Badge>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.programName} &middot; {item.type}</p>
                  </div>

                  <div className="text-[11px] text-gray-400 flex-shrink-0 hidden sm:block">
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </div>

                  <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>

            {actionItems.length > 8 && (
              <div className="px-5 py-2 border-t border-gray-100">
                <button
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAllItems ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showAllItems ? 'Show less' : `Show all ${actionItems.length} items`}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. URGENCY STATS — 3 compact cards in a row */}
      {dashboardPrefs.showUrgencyStats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${overdueCount > 0 ? 'border-red-200 bg-red-50/50' : 'border-gray-200/80 bg-white'}`}
            onClick={() => setLocation('/milestones')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${overdueCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`h-4 w-4 ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${overdueCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>{overdueCount}</p>
                <p className="text-[11px] text-gray-500">Overdue Items</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${dueThisWeekCount > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200/80 bg-white'}`}
            onClick={() => setLocation('/milestones')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dueThisWeekCount > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                <Calendar className={`h-4 w-4 ${dueThisWeekCount > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${dueThisWeekCount > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{dueThisWeekCount}</p>
                <p className="text-[11px] text-gray-500">Due This Week</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${criticalCount > 0 ? 'border-violet-200 bg-violet-50/50' : 'border-gray-200/80 bg-white'}`}
            onClick={() => setLocation('/risk-management')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${criticalCount > 0 ? 'bg-violet-100' : 'bg-gray-100'}`}>
                <Zap className={`h-4 w-4 ${criticalCount > 0 ? 'text-violet-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${criticalCount > 0 ? 'text-violet-700' : 'text-gray-900'}`}>{criticalCount}</p>
                <p className="text-[11px] text-gray-500">Critical Risks</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. AI BRIEFING — Collapsible one-line banner */}
      {dashboardPrefs.showAIBriefing && (
        <Card className="border border-gray-200/80 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => setBriefingExpanded(!briefingExpanded)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {briefingLoading ? (
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                ) : briefing?.summary ? (
                  <p className="text-[12px] text-gray-700 truncate">{briefing.summary}</p>
                ) : (
                  <p className="text-[12px] text-gray-400 italic">Create programs to get AI-powered daily briefings</p>
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">AI Briefing</span>
              {briefingExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {briefingExpanded && briefing?.summary && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                {briefing.alerts && briefing.alerts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {briefing.alerts.map((alert, i) => (
                      <Badge key={i} className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                        {alert.length > 80 ? alert.substring(0, 80) + '...' : alert}
                      </Badge>
                    ))}
                  </div>
                )}
                {briefing.priorities && briefing.priorities.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Top Priorities</p>
                    {briefing.priorities.slice(0, 5).map((p, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-[12px] text-gray-600 leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                )}
                {briefing.recommendations && briefing.recommendations.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Recommendations</p>
                    {briefing.recommendations.slice(0, 3).map((r, i) => (
                      <p key={i} className="text-[11px] text-gray-500 leading-relaxed pl-1">&bull; {r}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
