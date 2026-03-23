import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { PMPRecommendationsPanel } from "@/components/pmp/PMPRecommendationsPanel";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MissingComponentsModal } from "@/components/modals/MissingComponentsModal";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartGantt,
  AlertTriangle,
  Flag,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  ArrowRight,
  Activity,
} from "lucide-react";
import { calculateProgramHealth, getHealthBadge } from "@/lib/healthCalculation";
import { useAppStore } from "@/stores/appStore";
import type { Program, Risk, Milestone, Adopter, Dependency, Escalation } from "@shared/schema";

interface ActivityItem {
  type: string;
  title: string;
  programName: string;
  action: string;
  timestamp: string;
}

function relativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

export default function Dashboard() {
  const dashboardPrefs = useAppStore((s) => s.dashboardPrefs);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showMissingComponentsModal, setShowMissingComponentsModal] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [newProgramForm, setNewProgramForm] = useState({
    name: "",
    description: "",
    status: "planning" as const,
    platform: "",
    initiative: ""
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Auto-sync Jira projects + detect gaps on dashboard load
  useEffect(() => {
    const dashboardInit = async () => {
      try {
        // Sync Jira projects as programs and issues as milestones
        await apiRequest('/api/jira/auto-sync', 'POST');
        queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      } catch {
        // Jira not configured — silently skip
      }
      try {
        await apiRequest('/api/programs/detect-all-gaps', 'POST');
        queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      } catch (error) {
        console.error('Failed to run gap detection:', error);
      }
    };
    dashboardInit();
  }, []);

  // WebSocket connection for real-time updates (gracefully skipped on serverless/Vercel)
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to WebSocket for real-time updates');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'data_changed') {
            queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
            queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
            queryClient.invalidateQueries({ queryKey: ["/api/adopters"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dependencies"] });
            queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
            queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
            queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/priorities"] });
            queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
            queryClient.invalidateQueries({ queryKey: ["/api/escalations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activity"] });
          }
        } catch (error) {
          // Silently ignore parse errors
        }
      };

      ws.onclose = () => {};
      ws.onerror = () => {};
    } catch {
      // WebSocket not available (serverless deployment) — app works fine without it
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [queryClient]);

  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: risks = [] } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
  });

  const { data: dependencies = [] } = useQuery<Dependency[]>({
    queryKey: ["/api/dependencies"],
  });

  const { data: activityItems = [] } = useQuery<ActivityItem[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  const createProgramMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/programs", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program created successfully",
      });
      setShowNewProgramModal(false);
      setNewProgramForm({ name: "", description: "", status: "planning", platform: "", initiative: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive",
      });
    },
  });

  const handleNewProgram = () => {
    setShowNewProgramModal(true);
  };

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramForm.name.trim()) {
      toast({
        title: "Error",
        description: "Program name is required",
        variant: "destructive",
      });
      return;
    }
    createProgramMutation.mutate(newProgramForm);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'planning': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <Flag className="h-4 w-4 text-gray-600" />;
      default: return <ChartGantt className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'program': return <ChartGantt className="h-3 w-3 text-blue-500" />;
      case 'milestone': return <Flag className="h-3 w-3 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'escalation': return <AlertTriangle className="h-3 w-3 text-amber-500" />;
      default: return <Activity className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title="Dashboard"
        subtitle="Prioritized view — what needs your attention now"
        onNewClick={handleNewProgram}
        showScopeToggle={true}
      />

      <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* Today's Focus: Action Items (hero) + Urgency Stats + AI Briefing (collapsible) */}
        <TodaysFocus />

        {/* Programs by Priority — top 6 only */}
        {dashboardPrefs.showProgramsList && (
          <div className="mb-6" id="active-programs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 tracking-tight">Programs by Priority</h2>
                <p className="text-xs text-gray-500 mt-0.5">Most urgent programs first</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/programs")}
                  className="text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Eye className="h-3 w-3 mr-1.5" />
                  View All ({programs.length})
                </Button>
                <Button
                  size="sm"
                  onClick={handleNewProgram}
                  className="text-xs bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  New Program
                </Button>
              </div>
            </div>

            {programsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : programs.length === 0 ? (
              <Card className="border border-gray-200">
                <CardContent className="p-12 text-center">
                  <ChartGantt size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
                  <p className="text-gray-500 mb-4">Create your first program to start tracking progress.</p>
                  <Button onClick={handleNewProgram} className="bg-primary-500 text-white hover:bg-primary-600">
                    Create First Program
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {programs
                  .sort((a, b) => {
                    const aOverdue = milestones.filter(m => m.programId === a.id && m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed').length;
                    const bOverdue = milestones.filter(m => m.programId === b.id && m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed').length;
                    const aCritical = risks.filter(r => r.programId === a.id && (r.severity === 'critical' || r.severity === 'high')).length;
                    const bCritical = risks.filter(r => r.programId === b.id && (r.severity === 'critical' || r.severity === 'high')).length;
                    const aScore = (aOverdue * 3) + (aCritical * 2);
                    const bScore = (bOverdue * 3) + (bCritical * 2);
                    if (bScore !== aScore) return bScore - aScore;
                    return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
                  })
                  .slice(0, 6)
                  .map((program) => {
                    const programRisks = risks.filter(r => r.programId === program.id);
                    const programMilestones = milestones.filter(m => m.programId === program.id);
                    const programDependencies = dependencies.filter(d => d.programId === program.id);

                    const criticalRisks = programRisks.filter(r => r.severity === 'critical' || r.severity === 'high');
                    const overdueMilestones = programMilestones.filter(m =>
                      m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed'
                    );

                    const healthMetrics = calculateProgramHealth({
                      risks: programRisks,
                      milestones: programMilestones,
                      dependencies: programDependencies,
                      missingComponents: 0
                    });
                    const healthBadge = getHealthBadge(healthMetrics.score);

                    // Build a concise summary line with only non-zero items
                    const summaryParts: string[] = [];
                    if (overdueMilestones.length > 0) summaryParts.push(`${overdueMilestones.length} overdue`);
                    if (criticalRisks.length > 0) summaryParts.push(`${criticalRisks.length} critical risk${criticalRisks.length > 1 ? 's' : ''}`);
                    if (summaryParts.length === 0 && programMilestones.length > 0) summaryParts.push(`${programMilestones.length} milestones`);
                    if (summaryParts.length === 0 && programRisks.length > 0) summaryParts.push(`${programRisks.length} risks`);
                    if (summaryParts.length === 0) summaryParts.push('No items yet');

                    return (
                      <Card
                        key={program.id}
                        className="border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
                        onClick={() => setLocation(`/programs/${program.id}`)}
                      >
                        <CardContent className="p-4">
                          {/* Row 1: Icon + Name + Health */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {getStatusIcon(program.status || 'active')}
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{program.name}</h3>
                            </div>
                            <Badge className={`${healthBadge.color} text-[10px] flex-shrink-0 ml-2`}>
                              {healthBadge.label}
                            </Badge>
                          </div>
                          {/* Row 2: Concise summary */}
                          <p className="text-[11px] text-gray-500 pl-6">
                            {summaryParts.join(' \u00B7 ')}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Recent Activity Feed */}
        {activityItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900 tracking-tight">Recent Activity</h2>
              </div>
              <span className="text-[11px] text-gray-400">Last 48 hours</span>
            </div>
            <Card className="border border-gray-200/80 shadow-sm bg-white">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {activityItems.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-gray-700 truncate">
                          <span className="font-medium">{item.title}</span>
                          {item.programName && (
                            <span className="text-gray-400"> in {item.programName}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {relativeTime(item.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PMP Recommendations - collapsible */}
        {dashboardPrefs.showPMPRecommendations && (
          <div className="mt-6">
            <PMPRecommendationsPanel />
          </div>
        )}
      </main>

      {/* Missing Components Modal */}
      {showMissingComponentsModal && selectedProgram && analysisData && (
        <MissingComponentsModal
          open={showMissingComponentsModal}
          onClose={() => setShowMissingComponentsModal(false)}
          program={selectedProgram}
          analysis={analysisData}
        />
      )}

      {/* New Program Modal */}
      <Dialog open={showNewProgramModal} onOpenChange={setShowNewProgramModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProgram} className="space-y-4">
            <div>
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                value={newProgramForm.name}
                onChange={(e) => setNewProgramForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter program name"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProgramForm.description}
                onChange={(e) => setNewProgramForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter program description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={newProgramForm.platform} onValueChange={(value) => setNewProgramForm(prev => ({ ...prev, platform: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Platforms</SelectItem>
                    <SelectItem value="Platform A">Platform A</SelectItem>
                    <SelectItem value="Platform B">Platform B</SelectItem>
                    <SelectItem value="Platform C">Platform C</SelectItem>
                    <SelectItem value="Platform D">Platform D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="initiative">Initiative</Label>
                <Select value={newProgramForm.initiative} onValueChange={(value) => setNewProgramForm(prev => ({ ...prev, initiative: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select initiative" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Initiatives</SelectItem>
                    <SelectItem value="Digital Transformation">Digital Transformation</SelectItem>
                    <SelectItem value="Cloud Migration">Cloud Migration</SelectItem>
                    <SelectItem value="Customer Experience">Customer Experience</SelectItem>
                    <SelectItem value="AI/ML Integration">AI/ML Integration</SelectItem>
                    <SelectItem value="Security Enhancement">Security Enhancement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowNewProgramModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProgramMutation.isPending}>
                {createProgramMutation.isPending ? "Creating..." : "Create Program"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
