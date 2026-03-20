import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
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

  const { data: priorities, isLoading: prioritiesLoading } = useQuery<DashboardPriorities>({
    queryKey: ["/api/dashboard/priorities"],
  });

  const { data: briefing, isLoading: briefingLoading } = useQuery<AIBriefing>({
    queryKey: ["/api/ai/daily-briefing"],
    staleTime: 10 * 60 * 1000, // cache for 10 min
  });

  const overdueCount = priorities?.overdue?.length ?? 0;
  const dueThisWeekCount = priorities?.dueThisWeek?.length ?? 0;
  const blockedCount = priorities?.blockedDependencies?.length ?? 0;
  const criticalCount = priorities?.criticalRisks?.length ?? 0;
  const totalActionItems = overdueCount + dueThisWeekCount;

  // Merge overdue + this week into a single sequenced list
  const actionItems: Array<PriorityItem & { urgency: 'overdue' | 'due-today' | 'this-week' }> = [];

  if (priorities?.overdue) {
    for (const item of priorities.overdue) {
      actionItems.push({ ...item, urgency: 'overdue' });
    }
  }
  if (priorities?.dueThisWeek) {
    for (const item of priorities.dueThisWeek) {
      const isToday = item.daysUntilDue === 0;
      actionItems.push({ ...item, urgency: isToday ? 'due-today' : 'this-week' });
    }
  }

  const visibleItems = showAllItems ? actionItems : actionItems.slice(0, 8);
  const hasAlerts = briefing?.alerts && briefing.alerts.length > 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Hero: AI Briefing + Urgency Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Daily Briefing */}
        <Card className="lg:col-span-2 border-l-4 border-l-blue-500 bg-white border-gray-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900">Today's Focus</h2>
                <p className="text-[11px] text-gray-400">AI-generated daily briefing</p>
              </div>
            </div>

            {briefingLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
              </div>
            ) : briefing?.summary ? (
              <div className="space-y-3">
                {hasAlerts && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {briefing.alerts.map((alert, i) => (
                      <Badge key={i} className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                        {alert.length > 60 ? alert.substring(0, 60) + '...' : alert}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-[13px] text-gray-700 leading-relaxed">{briefing.summary}</p>
                {briefing.priorities && briefing.priorities.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Top Priorities</p>
                    {briefing.priorities.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-[12px] text-gray-600 leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-gray-500 italic">Create programs with milestones and due dates to get AI-powered daily briefings.</p>
            )}
          </CardContent>
        </Card>

        {/* Urgency Stats */}
        <div className="space-y-3">
          <Card className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${overdueCount > 0 ? 'border-red-200 bg-red-50/50' : 'border-gray-200/80 bg-white'}`}>
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

          <Card className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${dueThisWeekCount > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200/80 bg-white'}`}>
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

          <Card className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${criticalCount > 0 ? 'border-violet-200 bg-violet-50/50' : 'border-gray-200/80 bg-white'}`}>
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
      </div>

      {/* This Week: Sequenced Action Items */}
      {totalActionItems > 0 && (
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
    </div>
  );
}
