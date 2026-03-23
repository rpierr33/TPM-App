import { useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PMPRecommendationsPanel } from "@/components/pmp/PMPRecommendationsPanel";
import { ProgramTodos } from "@/components/program/ProgramTodos";
import { ProgramDecisions } from "@/components/program/ProgramDecisions";
import { getMissingComponents as getMissingComponentsUtil } from "@/lib/missingComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/authFetch";
import { calculateProgramHealth, getHealthBadge, getHealthProgressColor } from "@/lib/healthCalculation";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Brain,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Zap,
  Star,
  Eye,
  Edit,
  Pencil,
  Check,
  X,
  Plus,
  Flag,
  ChartGantt,
  Activity,
  BarChart3,
  FileText,
  Link2,
  Gauge,
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  FileBarChart,
  Copy,
  Loader2
} from "lucide-react";

const CLERK_ENABLED = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function useSafeUserId(): string | null | undefined {
  if (!CLERK_ENABLED) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkAuth().userId;
}

interface ProgramDetailsProps {
  programId: string;
}

export default function ProgramDetails({ programId }: ProgramDetailsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = useSafeUserId();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showTrackingModules, setShowTrackingModules] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [selectedJiraProject, setSelectedJiraProject] = useState<string>("");
  const [showWeeklyStatus, setShowWeeklyStatus] = useState(false);
  const [weeklyStatusData, setWeeklyStatusData] = useState<any>(null);
  const [weeklyStatusLoading, setWeeklyStatusLoading] = useState(false);

  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      return await apiRequest(`/api/programs/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Program updated successfully" });
      setIsEditingName(false);
      setEditingField(null);
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update program", variant: "destructive" });
    },
  });

  const toggleComponentMutation = useMutation({
    mutationFn: async ({ id, disabledComponents }: { id: string; disabledComponents: string[] }) => {
      return await apiRequest(`/api/programs/${id}`, "PUT", { disabledComponents });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tracking modules updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tracking modules",
        variant: "destructive",
      });
    },
  });

  // Fetch program data
  const { data: programs = [] } = useQuery<any[]>({ queryKey: ["/api/programs"] });
  const { data: stakeholders = [] } = useQuery<any[]>({ queryKey: ["/api/stakeholders"] });
  const { data: risks = [] } = useQuery<any[]>({ queryKey: ["/api/risks"] });
  const { data: milestones = [] } = useQuery<any[]>({ queryKey: ["/api/milestones"] });
  const { data: dependencies = [] } = useQuery<any[]>({ queryKey: ["/api/dependencies"] });
  const { data: adopters = [] } = useQuery<any[]>({ queryKey: ["/api/adopters"] });

  // Jira integration — check disabled inline since program may not exist yet
  const jiraEnabled = (() => {
    const p = programs.find((p: any) => p.id === programId);
    if (!p) return false;
    const dc: string[] = Array.isArray(p.disabledComponents) ? p.disabledComponents : [];
    return !dc.includes('jira');
  })();

  const { data: jiraStatus } = useQuery<{
    connected: boolean;
    user: string | null;
    projects: { id: string; key: string; name: string; projectTypeKey: string }[];
  }>({
    queryKey: ["/api/jira/status"],
    enabled: jiraEnabled,
  });

  const { data: jiraIssues = [], isLoading: jiraIssuesLoading, refetch: refetchJiraIssues } = useQuery<any[]>({
    queryKey: ["/api/jira/issues", selectedJiraProject],
    queryFn: async () => {
      if (!selectedJiraProject) return [];
      const headers: Record<string, string> = {};
      const token = await getAuthToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/jira/issues?projectKey=${selectedJiraProject}`, { headers, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Jira issues");
      return res.json();
    },
    enabled: jiraEnabled && !!selectedJiraProject && !!jiraStatus?.connected,
  });

  const syncJiraMutation = useMutation({
    mutationFn: async (projectKey: string) => {
      return await apiRequest(`/api/jira/sync/${programId}`, "POST", { projectKey });
    },
    onSuccess: (data: any) => {
      toast({ title: "Jira Sync Complete", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      refetchJiraIssues();
    },
    onError: (error: any) => {
      toast({ title: "Sync Failed", description: error.message || "Failed to sync Jira issues", variant: "destructive" });
    },
  });

  const handleGenerateWeeklyStatus = async () => {
    setWeeklyStatusLoading(true);
    setShowWeeklyStatus(true);
    try {
      const data = await apiRequest(`/api/programs/${programId}/weekly-status`, "POST");
      setWeeklyStatusData(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate weekly status", variant: "destructive" });
      setShowWeeklyStatus(false);
    } finally {
      setWeeklyStatusLoading(false);
    }
  };

  const formatWeeklyStatusMarkdown = () => {
    if (!weeklyStatusData) return "";
    const d = weeklyStatusData;
    const lines: string[] = [];
    lines.push(`# Weekly Status: ${d.summary.programName}`);
    lines.push(`**Status:** ${d.summary.status} | **Health Score:** ${d.summary.healthScore}%`);
    lines.push("");
    if (d.completedThisWeek?.length > 0) { lines.push("## Completed This Week"); d.completedThisWeek.forEach((item: any) => lines.push(`- ${item.title}`)); lines.push(""); }
    if (d.inProgress?.length > 0) { lines.push("## In Progress"); d.inProgress.forEach((item: any) => lines.push(`- ${item.title} [${item.status}]`)); lines.push(""); }
    if (d.risksAndBlockers?.criticalHighRisks?.length > 0) { lines.push("## Risks & Blockers"); d.risksAndBlockers.criticalHighRisks.forEach((r: any) => lines.push(`- [${(r.severity || "").toUpperCase()}] ${r.title}`)); lines.push(""); }
    if (d.overdueItems?.length > 0) { lines.push("## Overdue"); d.overdueItems.forEach((item: any) => lines.push(`- ${item.title} — ${item.daysOverdue}d overdue`)); lines.push(""); }
    if (d.nextWeekFocus?.length > 0) { lines.push("## Next Week"); d.nextWeekFocus.forEach((item: any) => lines.push(`- ${item.title}`)); lines.push(""); }
    return lines.join("\n");
  };

  const handleCopyWeeklyStatus = async () => {
    try { await navigator.clipboard.writeText(formatWeeklyStatusMarkdown()); toast({ title: "Copied to clipboard" }); } catch { toast({ title: "Failed to copy", variant: "destructive" }); }
  };

  const program = programs.find(p => p.id === programId);

  if (!program) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Program Not Found</h3>
          <p className="text-gray-500 mb-4">The requested program could not be found.</p>
          <Button onClick={() => setLocation("/programs")}>Back to Programs</Button>
        </div>
      </div>
    );
  }

  // Disabled components helper
  const disabledComponents: string[] = Array.isArray(program.disabledComponents) ? program.disabledComponents : [];
  const isComponentDisabled = (component: string) => disabledComponents.includes(component);
  const handleToggleComponent = (component: string, enabled: boolean) => {
    const updated = enabled
      ? disabledComponents.filter((c: string) => c !== component)
      : [...disabledComponents, component];
    toggleComponentMutation.mutate({ id: programId, disabledComponents: updated });
  };

  // Filter data for this program
  const programStakeholders = stakeholders.filter(s => s.programId === programId);
  const programRisks = risks.filter(r => r.programId === programId);
  const programMilestones = milestones.filter(m => m.programId === programId);
  const programDependencies = dependencies.filter(d => d.programId === programId);
  const programAdopters = adopters.filter(a => a.programId === programId);

  // Calculate missing components using shared utility
  const missingComponentsList = getMissingComponentsUtil(program, {
    risks: programRisks.length,
    milestones: programMilestones.length,
    adopters: programAdopters.length,
  });
  const getMissingComponents = () => missingComponentsList.map(c => c.label);

  const dismissWarning = (key: string) => {
    const current: string[] = Array.isArray(program.dismissedWarnings) ? program.dismissedWarnings : [];
    if (!current.includes(key)) {
      updateProgramMutation.mutate({
        id: programId,
        data: { dismissedWarnings: [...current, key] }
      });
    }
  };

  // Calculate program health using centralized utility
  const healthMetrics = calculateProgramHealth({
    risks: programRisks,
    milestones: programMilestones,
    dependencies: programDependencies,
    missingComponents: getMissingComponents().length
  });

  // Get upcoming items (next 30 days)
  const getUpcomingItems = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const upcomingMilestones = programMilestones.filter(m => {
      if (!m.dueDate || m.status === 'completed') return false;
      const dueDate = new Date(m.dueDate);
      return dueDate >= today && dueDate <= thirtyDaysFromNow;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return { upcomingMilestones };
  };

  const upcoming = getUpcomingItems();

  // Generate program summary for stakeholders
  const generateProgramSummary = () => {
    const completedMilestones = programMilestones.filter(m => m.status === 'completed').length;
    const totalMilestones = programMilestones.length;
    const mitigatedRisks = programRisks.filter(r => r.status === 'mitigated' || r.status === 'resolved').length;
    
    const summary = `The ${program.name} is currently in ${program.status} status with ${healthMetrics.score}% health score. The program encompasses ${programMilestones.length + programRisks.length + programDependencies.length + programStakeholders.length} tracked components including ${programMilestones.length} milestones, ${programRisks.length} risks, ${programDependencies.length} dependencies, and ${programStakeholders.length} stakeholders. Progress indicates ${completedMilestones} of ${totalMilestones} milestones completed (${totalMilestones > 0 ? Math.round((completedMilestones/totalMilestones) * 100) : 0}%) with ${mitigatedRisks} risks successfully mitigated.

    ${healthMetrics.status === 'At Risk' ? 'Immediate attention required due to ' + healthMetrics.breakdown.criticalRisks + ' high-severity risks and ' + healthMetrics.breakdown.overdueMilestones + ' overdue milestones.' : 
      healthMetrics.score < 60 ? 'Program requires monitoring with ' + (healthMetrics.breakdown.criticalRisks + healthMetrics.breakdown.overdueMilestones) + ' items needing attention.' :
      'Program is performing well with no critical issues identified.'} Key focus areas include ${upcoming.upcomingMilestones.length > 0 ? upcoming.upcomingMilestones.length + ' upcoming milestones in the next 30 days' : 'maintaining current momentum'} and ${programDependencies.filter(d => d.status === 'at_risk').length > 0 ? 'resolving at-risk dependencies' : 'dependency management'}.`;
    
    return summary;
  };

  // PMI Stakeholder Analysis - Power/Interest Grid
  const getStakeholderPowerInterestCategory = (stakeholder: any) => {
    const power = stakeholder.influenceLevel || 1;
    const interest = stakeholder.supportLevel || 1;
    
    if (power >= 4 && interest >= 4) return { category: "Manage Closely", color: "bg-red-100 text-red-800", priority: "Critical" };
    if (power >= 4 && interest < 4) return { category: "Keep Satisfied", color: "bg-yellow-100 text-yellow-800", priority: "High" };
    if (power < 4 && interest >= 4) return { category: "Keep Informed", color: "bg-blue-100 text-blue-800", priority: "Medium" };
    return { category: "Monitor", color: "bg-gray-100 text-gray-800", priority: "Low" };
  };

  // Calculate stakeholder management completeness based on PMI standards
  const getStakeholderCompleteness = () => {
    if (programStakeholders.length === 0) return { percentage: 0, missing: ["Stakeholder identification"] };
    
    const requirements = [
      "Basic Contact Info",
      "Role Definition", 
      "Influence Level",
      "Support Level",
      "Leadership Style",
      "Communication Preference",
      "Engagement Strategy"
    ];
    
    let completed = 0;
    const missing = [];
    
    // Check overall stakeholder coverage
    if (programStakeholders.length > 0) completed++;
    else missing.push("Stakeholder identification");
    
    // Check data completeness across stakeholders
    const hasRoles = programStakeholders.some(s => s.role);
    const hasInfluence = programStakeholders.some(s => s.influenceLevel);
    const hasSupport = programStakeholders.some(s => s.supportLevel);
    const hasLeadershipStyle = programStakeholders.some(s => s.leadershipStyle);
    const hasCommPref = programStakeholders.some(s => s.preferredCommunication);
    
    if (hasRoles) completed++; else missing.push("Role definitions");
    if (hasInfluence) completed++; else missing.push("Influence level assessment");
    if (hasSupport) completed++; else missing.push("Support level evaluation");
    if (hasLeadershipStyle) completed++; else missing.push("Leadership style analysis");
    if (hasCommPref) completed++; else missing.push("Communication preferences");
    if (programStakeholders.length >= 3) completed++; else missing.push("Comprehensive stakeholder mapping");

    return {
      percentage: Math.round((completed / requirements.length) * 100),
      missing,
      completed
    };
  };

  const stakeholderCompleteness = getStakeholderCompleteness();

  // PMI recommended next actions
  const getNextActions = () => {
    const actions = [];
    
    if (programStakeholders.length === 0) {
      actions.push({
        priority: "Critical",
        action: "Conduct stakeholder identification workshop",
        description: "Use brainstorming and analysis techniques to identify all project stakeholders",
        dueDate: "Immediate",
        pmiBasis: "PMBOK Stakeholder Management - Identify Stakeholders process"
      });
    }
    
    if (programStakeholders.length < 3) {
      actions.push({
        priority: "High", 
        action: "Complete stakeholder mapping",
        description: "Ensure all key stakeholder groups are identified (sponsors, users, vendors, etc.)",
        dueDate: "Within 1 week",
        pmiBasis: "PMI Standard for Project Management - Stakeholder engagement"
      });
    }
    
    const missingInfluence = programStakeholders.filter(s => !s.influenceLevel).length;
    if (missingInfluence > 0) {
      actions.push({
        priority: "High",
        action: `Assess influence levels for ${missingInfluence} stakeholder(s)`,
        description: "Rate stakeholder power/authority on 1-5 scale for proper engagement strategy",
        dueDate: "Within 3 days",
        pmiBasis: "PMI Power/Interest Grid methodology"
      });
    }
    
    const missingCommPref = programStakeholders.filter(s => !s.preferredCommunication).length;
    if (missingCommPref > 0) {
      actions.push({
        priority: "Medium",
        action: `Define communication preferences for ${missingCommPref} stakeholder(s)`,
        description: "Document preferred communication methods and frequency",
        dueDate: "Within 1 week", 
        pmiBasis: "PMBOK Communications Management integration"
      });
    }

    return actions;
  };

  const nextActions = getNextActions();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800 border-red-200";
      case "High": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Medium": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <>
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl font-bold h-10 w-80"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editedName.trim()) {
                          updateProgramMutation.mutate({ id: programId, data: { ...program, name: editedName.trim() } });
                        }
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (editedName.trim()) {
                          updateProgramMutation.mutate({ id: programId, data: { ...program, name: editedName.trim() } });
                        }
                      }}
                      disabled={updateProgramMutation.isPending}
                    >
                      <Check size={16} className="text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingName(false)}
                    >
                      <X size={16} className="text-gray-500" />
                    </Button>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedName(program.name);
                        setIsEditingName(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Pencil size={14} />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-gray-600 mt-1">{program.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerateWeeklyStatus} disabled={weeklyStatusLoading} className="text-gray-600 hover:text-gray-800 border-gray-200">
              {weeklyStatusLoading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <FileBarChart size={14} className="mr-2" />}
              Generate Status
            </Button>
            <Badge className={`border ${program.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
              {program.status || 'planning'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tracking Modules Settings */}
      <div className="mx-5 mt-4">
        <button
          onClick={() => setShowTrackingModules(!showTrackingModules)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Settings size={14} />
          <span className="font-medium">Tracking Modules</span>
          {showTrackingModules ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {showTrackingModules && (
          <Card className="mt-2">
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 mb-3">Toggle which tracking modules are active for this program. Disabled modules will be hidden and excluded from gap detection.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="toggle-milestones" checked disabled />
                  <Label htmlFor="toggle-milestones" className="text-sm text-gray-500">Milestones</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="toggle-risks" checked disabled />
                  <Label htmlFor="toggle-risks" className="text-sm text-gray-500">Risks</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="toggle-adopters"
                    checked={!isComponentDisabled('adopters')}
                    onCheckedChange={(checked) => handleToggleComponent('adopters', checked)}
                  />
                  <Label htmlFor="toggle-adopters" className="text-sm">Adopters</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="toggle-dependencies"
                    checked={!isComponentDisabled('dependencies')}
                    onCheckedChange={(checked) => handleToggleComponent('dependencies', checked)}
                  />
                  <Label htmlFor="toggle-dependencies" className="text-sm">Dependencies</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="toggle-escalations"
                    checked={!isComponentDisabled('escalations')}
                    onCheckedChange={(checked) => handleToggleComponent('escalations', checked)}
                  />
                  <Label htmlFor="toggle-escalations" className="text-sm">Escalations</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="toggle-jira"
                    checked={!isComponentDisabled('jira')}
                    onCheckedChange={(checked) => handleToggleComponent('jira', checked)}
                  />
                  <Label htmlFor="toggle-jira" className="text-sm">Jira Integration</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${6 + (isComponentDisabled('dependencies') ? 0 : 1) + (isComponentDisabled('adopters') ? 0 : 1) + (isComponentDisabled('jira') ? 0 : 1)}, minmax(0, 1fr))` }}>
            <TabsTrigger value="overview">Snapshot</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            {!isComponentDisabled('dependencies') && <TabsTrigger value="dependencies">Dependencies</TabsTrigger>}
            {!isComponentDisabled('adopters') && <TabsTrigger value="adopters">Adoption</TabsTrigger>}
            <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            {!isComponentDisabled('jira') && <TabsTrigger value="jira">Jira</TabsTrigger>}
          </TabsList>

          <TabsContent value="todos" className="mt-6">
            <ProgramTodos programId={programId} />
          </TabsContent>

          <TabsContent value="decisions" className="mt-6">
            <ProgramDecisions programId={programId} />
          </TabsContent>

          <TabsContent value="stakeholders" className="space-y-6 mt-6">
            {/* Stakeholder Management Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stakeholder Completeness */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    PMI Compliance Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Stakeholder Management</span>
                        <span className={`font-semibold ${stakeholderCompleteness.percentage >= 80 ? 'text-green-600' : stakeholderCompleteness.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {stakeholderCompleteness.percentage}%
                        </span>
                      </div>
                      <Progress value={stakeholderCompleteness.percentage} className="w-full" />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>{stakeholderCompleteness.completed}</strong> of 7 PMI requirements completed</p>
                      <p
                        className="cursor-pointer hover:text-blue-700"
                        onClick={() => setLocation("/stakeholders")}
                      >
                        <strong>{programStakeholders.length}</strong> stakeholders identified
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Power/Interest Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Power/Interest Grid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["Manage Closely", "Keep Satisfied", "Keep Informed", "Monitor"].map(category => {
                      const count = programStakeholders.filter(s => 
                        getStakeholderPowerInterestCategory(s).category === category
                      ).length;
                      const { color } = getStakeholderPowerInterestCategory({ influenceLevel: category.includes("Manage") ? 5 : category.includes("Satisfied") ? 5 : category.includes("Informed") ? 2 : 1, supportLevel: category.includes("Manage") ? 5 : category.includes("Informed") ? 5 : category.includes("Satisfied") ? 2 : 1 });
                      
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <Badge className={`${color} text-xs`}>{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Next Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-green-600" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nextActions.slice(0, 3).map((action, index) => (
                      <div key={index} className="space-y-2">
                        <Badge className={`${getPriorityColor(action.priority)} text-xs`}>
                          {action.priority}
                        </Badge>
                        <p className="text-sm font-medium">{action.action}</p>
                        <p className="text-xs text-gray-500">{action.dueDate}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Missing Requirements Alert */}
            {stakeholderCompleteness.missing.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800 mb-2">PMI Compliance Gaps Identified</h4>
                      <div className="space-y-1">
                        {stakeholderCompleteness.missing.map((item, index) => (
                          <p key={index} className="text-sm text-yellow-700">• {item}</p>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => {
                          setLocation("/stakeholders");
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Address Gaps
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stakeholders List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Program Stakeholders ({programStakeholders.length})
                  </div>
                  <Button size="sm" onClick={() => {
                    toast({
                      title: "Feature Coming Soon", 
                      description: "Add stakeholder functionality will be available shortly.",
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stakeholder
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {programStakeholders.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Stakeholders Identified</h3>
                    <p className="text-gray-500 mb-4">
                      According to PMI standards, stakeholder identification is critical for program success.
                      Start by identifying key sponsors, users, and other affected parties.
                    </p>
                    <Button onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Stakeholder identification wizard will be available shortly.",
                      });
                    }}>
                      <Target className="h-4 w-4 mr-2" />
                      Start Stakeholder Analysis
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {programStakeholders.map((stakeholder) => {
                      const analysis = getStakeholderPowerInterestCategory(stakeholder);
                      return (
                        <div key={stakeholder.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <UserCheck className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4
                                    className="font-medium text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                                    onClick={() => setLocation("/stakeholders")}
                                  >
                                    {stakeholder.name}
                                  </h4>
                                  <p className="text-sm text-gray-500">{stakeholder.role || "Role not defined"}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                <div>
                                  <span className="text-xs text-gray-500">Influence Level</span>
                                  <div className="flex items-center gap-1 mt-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={12} 
                                        className={i < (stakeholder.influenceLevel || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Support Level</span>
                                  <div className="flex items-center gap-1 mt-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={12} 
                                        className={i < (stakeholder.supportLevel || 0) ? "text-green-400 fill-green-400" : "text-gray-300"} 
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Leadership Style</span>
                                  <p className="text-sm font-medium mt-1">{stakeholder.leadershipStyle || "Not assessed"}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Communication</span>
                                  <p className="text-sm font-medium mt-1">{stakeholder.communicationStyle || "Not defined"}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={analysis.color}>
                                {analysis.category}
                              </Badge>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => {
                                  toast({
                                    title: "Feature Coming Soon",
                                    description: "Stakeholder detail view will be available shortly.",
                                  });
                                }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  toast({
                                    title: "Feature Coming Soon", 
                                    description: "Edit stakeholder functionality will be available shortly.",
                                  });
                                }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PMI Recommendations */}
            {nextActions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    PMI-Based Action Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {nextActions.map((action, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPriorityColor(action.priority)}>
                                {action.priority}
                              </Badge>
                              <span className="text-sm text-gray-500">{action.dueDate}</span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{action.action}</h4>
                            <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                            <p className="text-xs text-gray-500 italic">PMI Basis: {action.pmiBasis}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {!isComponentDisabled('adopters') && <TabsContent value="adopters" className="space-y-6 mt-6">
            {/* Team Adoption Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Adoption Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Adoption Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLocation(`/adopter-support?programId=${programId}`)}
                    >
                      <div className="text-3xl font-bold text-blue-600">{programAdopters.length}</div>
                      <div className="text-sm text-gray-600 hover:text-blue-700">Teams Adopting</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Not Started</span>
                        <span className="font-medium text-gray-600">
                          {programAdopters.filter(a => a.status === 'not_started').length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>In Progress</span>
                        <span className="font-medium text-blue-600">
                          {programAdopters.filter(a => a.status === 'in_progress').length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span className="font-medium text-green-600">
                          {programAdopters.filter(a => a.status === 'completed').length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Blocked</span>
                        <span className="font-medium text-red-600">
                          {programAdopters.filter(a => a.status === 'blocked').length}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-sm text-gray-600">
                        <strong>Overall Progress:</strong> {programAdopters.length > 0 ? Math.round((programAdopters.filter(a => a.status === 'completed').length / programAdopters.length) * 100) : 0}%
                      </div>
                      <Progress 
                        value={programAdopters.length > 0 ? (programAdopters.filter(a => a.status === 'completed').length / programAdopters.length) * 100 : 0} 
                        className="w-full mt-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Adoption Readiness */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Readiness Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">High Readiness</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {programAdopters.filter(a => a.readinessLevel === 'high').length}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Medium Readiness</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {programAdopters.filter(a => a.readinessLevel === 'medium').length}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Low Readiness</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {programAdopters.filter(a => a.readinessLevel === 'low').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    {programAdopters.filter(a => a.readinessLevel === 'low' || a.status === 'blocked').length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-sm text-red-600 font-medium">
                          ⚠️ {programAdopters.filter(a => a.readinessLevel === 'low' || a.status === 'blocked').length} teams need attention
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Next Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Next Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {programAdopters.filter(a => a.status === 'not_started').length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">• Initiate Onboarding:</span>
                        <br />
                        {programAdopters.filter(a => a.status === 'not_started').length} teams ready to start
                      </div>
                    )}
                    {programAdopters.filter(a => a.status === 'blocked').length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-red-600">• Resolve Blockers:</span>
                        <br />
                        {programAdopters.filter(a => a.status === 'blocked').length} teams need unblocking
                      </div>
                    )}
                    {programAdopters.filter(a => a.readinessLevel === 'low').length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-yellow-600">• Readiness Support:</span>
                        <br />
                        {programAdopters.filter(a => a.readinessLevel === 'low').length} teams need preparation
                      </div>
                    )}
                    {programAdopters.filter(a => a.status === 'in_progress').length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-blue-600">• Monitor Progress:</span>
                        <br />
                        {programAdopters.filter(a => a.status === 'in_progress').length} teams in progress
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Team List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Team Details & Onboarding Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {programAdopters.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Adopter Teams</h3>
                    <p className="text-gray-500 mb-4">Add teams that will be adopting this program to track their onboarding progress.</p>
                    <Button onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Add adopter team functionality will be available shortly.",
                      });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Adopter Team
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {programAdopters.map((adopter) => {
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'completed': return 'bg-green-100 text-green-800 border-green-200';
                          case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
                          case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
                          default: return 'bg-gray-100 text-gray-800 border-gray-200';
                        }
                      };

                      const getReadinessColor = (level: string) => {
                        switch (level) {
                          case 'high': return 'text-green-600';
                          case 'medium': return 'text-yellow-600';
                          case 'low': return 'text-red-600';
                          default: return 'text-gray-600';
                        }
                      };

                      return (
                        <div key={adopter.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div>
                                  <h4
                                    className="font-medium text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                                    onClick={() => setLocation(`/adopter-support?programId=${programId}`)}
                                  >
                                    {adopter.teamName}
                                  </h4>
                                  <p className="text-sm text-gray-600">{adopter.department}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                                <div>
                                  <span className="text-xs text-gray-500">Current Status</span>
                                  <div className="mt-1">
                                    <Badge className={getStatusColor(adopter.status)}>
                                      {adopter.status?.replace('_', ' ') || 'not started'}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Readiness Level</span>
                                  <p className={`text-sm font-medium mt-1 ${getReadinessColor(adopter.readinessLevel)}`}>
                                    {adopter.readinessLevel || 'not assessed'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Team Size</span>
                                  <p className="text-sm font-medium mt-1">{adopter.teamSize || 'N/A'} members</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Target Date</span>
                                  <p className="text-sm font-medium mt-1">
                                    {adopter.targetDate ? new Date(adopter.targetDate).toLocaleDateString() : 'Not set'}
                                  </p>
                                </div>
                              </div>

                              {adopter.blockers && adopter.blockers.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-xs text-gray-500">Current Blockers</span>
                                  <div className="mt-1 space-y-1">
                                    {adopter.blockers.map((blocker: string, index: number) => (
                                      <div key={index} className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {blocker}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {adopter.notes && (
                                <div className="mb-3">
                                  <span className="text-xs text-gray-500">Notes</span>
                                  <p className="text-sm text-gray-700 mt-1">{adopter.notes}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => {
                                  toast({
                                    title: "Feature Coming Soon",
                                    description: "Adopter detail view will be available shortly.",
                                  });
                                }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  toast({
                                    title: "Feature Coming Soon",
                                    description: "Edit adopter functionality will be available shortly.",
                                  });
                                }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>}

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Actionable Missing Components */}
            {missingComponentsList.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h4 className="text-sm font-semibold text-amber-800">{missingComponentsList.length} missing items</h4>
                  </div>
                  <div className="space-y-1.5">
                    {missingComponentsList.map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-amber-100/50 transition-colors">
                        <span className="text-[12px] text-amber-800">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          {item.type === 'field' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-100"
                              onClick={() => {
                                setEditingField(item.field || item.key);
                                setFieldValue("");
                              }}
                            >
                              Add
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-100"
                              onClick={() => {
                                if (item.key === 'risks') setLocation('/risk-management');
                                else if (item.key === 'milestones') setLocation('/milestones');
                                else if (item.key === 'adopters') setLocation('/adopter-support');
                              }}
                            >
                              Add
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] text-gray-400 hover:text-gray-600"
                            onClick={() => dismissWarning(item.key)}
                          >
                            N/A
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Program Health Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-blue-600" />
                    Program Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${healthMetrics.color}`}>{healthMetrics.score}%</div>
                      <div className={`text-lg font-medium ${healthMetrics.color}`}>{healthMetrics.status}</div>
                    </div>
                    <Progress value={healthMetrics.score} className="w-full" />
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• {programMilestones.length + programRisks.length + programDependencies.length + programStakeholders.length} components tracked</p>
                      <p
                        className="cursor-pointer hover:text-blue-700"
                        onClick={() => setLocation(`/risk-management?programId=${programId}`)}
                      >
                        • {healthMetrics.breakdown.criticalRisks} high-severity risks
                      </p>
                      <p
                        className="cursor-pointer hover:text-blue-700"
                        onClick={() => setLocation(`/milestones?programId=${programId}`)}
                      >
                        • {healthMetrics.breakdown.overdueMilestones} overdue milestones
                      </p>
                      <p
                        className="cursor-pointer hover:text-blue-700"
                        onClick={() => setLocation(`/dependencies?programId=${programId}`)}
                      >
                        • {healthMetrics.breakdown.blockedDependencies} blocked dependencies
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Component Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Component Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                      onClick={() => setLocation(`/risk-management?programId=${programId}`)}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm hover:text-blue-700">Risks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="cursor-pointer">{programRisks.length}</Badge>
                        <Badge className="bg-red-100 text-red-800 text-xs cursor-pointer">
                          {programRisks.filter(r => r.severity === 'high' || r.severity === 'critical').length} high
                        </Badge>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                      onClick={() => setLocation(`/milestones?programId=${programId}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-blue-600" />
                        <span className="text-sm hover:text-blue-700">Milestones</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="cursor-pointer">{programMilestones.length}</Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs cursor-pointer">
                          {programMilestones.filter(m => m.status === 'completed').length} done
                        </Badge>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                      onClick={() => setLocation(`/dependencies?programId=${programId}`)}
                    >
                      <div className="flex items-center gap-2">
                        <ChartGantt className="h-4 w-4 text-purple-600" />
                        <span className="text-sm hover:text-blue-700">Dependencies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="cursor-pointer">{programDependencies.length}</Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs cursor-pointer">
                          {programDependencies.filter(d => d.status === 'blocked').length} blocked
                        </Badge>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                      onClick={() => setLocation("/stakeholders")}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm hover:text-blue-700">Stakeholders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="cursor-pointer">{programStakeholders.length}</Badge>
                        <Badge className="bg-blue-100 text-blue-800 text-xs cursor-pointer">
                          {programStakeholders.filter(s => s.influenceLevel >= 4).length} high influence
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Upcoming (30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcoming.upcomingMilestones.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No upcoming milestones</p>
                    ) : (
                      upcoming.upcomingMilestones.slice(0, 4).map((milestone) => (
                        <div key={milestone.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span
                              className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                              onClick={() => setLocation(`/milestones?programId=${programId}`)}
                            >
                              {milestone.title}
                            </span>
                            <Badge className="text-xs">{milestone.status}</Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                    {upcoming.upcomingMilestones.length > 4 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{upcoming.upcomingMilestones.length - 4} more milestones
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Program Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed">{generateProgramSummary()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Critical Alerts */}
            {(healthMetrics.breakdown.criticalRisks > 0 || healthMetrics.breakdown.overdueMilestones > 0 || healthMetrics.breakdown.blockedDependencies > 0) && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Issues Requiring Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {healthMetrics.breakdown.criticalRisks > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <h4 className="font-medium text-red-800">High-Severity Risks</h4>
                          <p className="text-sm text-red-600">{healthMetrics.breakdown.criticalRisks} risks require immediate mitigation</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => setLocation(`/risk-management?programId=${programId}`)}>
                          Review Risks
                        </Button>
                      </div>
                    )}
                    {healthMetrics.breakdown.overdueMilestones > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <h4 className="font-medium text-red-800">Overdue Milestones</h4>
                          <p className="text-sm text-red-600">{healthMetrics.breakdown.overdueMilestones} milestones past due date</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => setLocation(`/milestones?programId=${programId}`)}>
                          Review Timeline
                        </Button>
                      </div>
                    )}
                    {healthMetrics.breakdown.blockedDependencies > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <h4 className="font-medium text-red-800">Blocked Dependencies</h4>
                          <p className="text-sm text-red-600">{healthMetrics.breakdown.blockedDependencies} dependencies blocking progress</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => setLocation(`/dependencies?programId=${programId}`)}>
                          Resolve Blocks
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Recommended Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthMetrics.breakdown.criticalRisks > 0 && (
                    <div className="border-l-4 border-red-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-900">1. Address High-Severity Risks</h4>
                      <p className="text-sm text-gray-600">Conduct risk mitigation workshops for {healthMetrics.breakdown.criticalRisks} critical risks</p>
                      <span className="text-xs text-red-600 font-medium">Priority: Critical</span>
                    </div>
                  )}
                  {healthMetrics.breakdown.overdueMilestones > 0 && (
                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-900">2. Reschedule Overdue Milestones</h4>
                      <p className="text-sm text-gray-600">Review and update timeline for {healthMetrics.breakdown.overdueMilestones} overdue deliverables</p>
                      <span className="text-xs text-yellow-600 font-medium">Priority: High</span>
                    </div>
                  )}
                  {upcoming.upcomingMilestones.length > 0 && (
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-900">3. Prepare for Upcoming Deliverables</h4>
                      <p className="text-sm text-gray-600">Focus on {upcoming.upcomingMilestones.length} milestones due in next 30 days</p>
                      <span className="text-xs text-blue-600 font-medium">Priority: Medium</span>
                    </div>
                  )}
                  {programStakeholders.filter(s => !s.leadershipStyle).length > 0 && (
                    <div className="border-l-4 border-green-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-900">4. Complete Stakeholder Analysis</h4>
                      <p className="text-sm text-gray-600">Profile {programStakeholders.filter(s => !s.leadershipStyle).length} stakeholders for better engagement</p>
                      <span className="text-xs text-green-600 font-medium">Priority: Medium</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Risks ({programRisks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {programRisks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No risks identified for this program.</p>
                ) : (
                  <div className="space-y-2">
                    {programRisks.map((risk) => (
                      <div key={risk.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h4
                            className="font-medium text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                            onClick={() => setLocation(`/risk-management?programId=${programId}`)}
                          >
                            {risk.title}
                          </h4>
                          <p className="text-sm text-gray-600">{risk.description}</p>
                        </div>
                        <Badge className={`${risk.severity === 'high' ? 'bg-red-100 text-red-800' : risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {risk.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Milestones ({programMilestones.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {programMilestones.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No milestones defined for this program.</p>
                ) : (
                  <div className="space-y-2">
                    {programMilestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h4
                            className="font-medium text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                            onClick={() => setLocation(`/milestones?programId=${programId}`)}
                          >
                            {milestone.title}
                          </h4>
                          <p className="text-sm text-gray-600">{milestone.description}</p>
                        </div>
                        <Badge>{milestone.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {!isComponentDisabled('dependencies') && (
            <TabsContent value="dependencies" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Program Dependencies ({programDependencies.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {programDependencies.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No dependencies identified for this program.</p>
                  ) : (
                    <div className="space-y-2">
                      {programDependencies.map((dependency) => (
                        <div key={dependency.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <h4
                              className="font-medium text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                              onClick={() => setLocation(`/dependencies?programId=${programId}`)}
                            >
                              {dependency.title}
                            </h4>
                            <p className="text-sm text-gray-600">{dependency.description}</p>
                          </div>
                          <Badge>{dependency.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Jira Integration Tab */}
          {!isComponentDisabled('jira') && (
            <TabsContent value="jira" className="mt-6 space-y-6">
              {!jiraStatus?.connected ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Jira Not Connected</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Configure Jira credentials in Settings to enable issue syncing.
                    </p>
                    <Button variant="outline" onClick={() => setLocation("/settings")}>
                      Go to Settings
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Sync Controls */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Jira Issue Sync</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <Label className="mb-2 block text-sm">Jira Project</Label>
                          <Select value={selectedJiraProject} onValueChange={setSelectedJiraProject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a Jira project" />
                            </SelectTrigger>
                            <SelectContent>
                              {(jiraStatus?.projects || []).map((proj) => (
                                <SelectItem key={proj.key} value={proj.key}>
                                  {proj.name} ({proj.key})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => selectedJiraProject && syncJiraMutation.mutate(selectedJiraProject)}
                          disabled={!selectedJiraProject || syncJiraMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${syncJiraMutation.isPending ? 'animate-spin' : ''}`} />
                          {syncJiraMutation.isPending ? "Syncing..." : "Sync Issues"}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Syncing will pull Jira issues and create/update milestones in this program.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Jira Issues List */}
                  {selectedJiraProject && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Jira Issues ({jiraIssues.length})</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => refetchJiraIssues()}
                            disabled={jiraIssuesLoading}
                          >
                            <RefreshCw className={`h-4 w-4 ${jiraIssuesLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {jiraIssuesLoading ? (
                          <div className="animate-pulse space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="h-16 bg-gray-100 rounded"></div>
                            ))}
                          </div>
                        ) : jiraIssues.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No issues found in this Jira project.</p>
                        ) : (
                          <div className="space-y-2">
                            {jiraIssues.map((issue: any) => {
                              const statusName = issue.fields?.status?.name || "Unknown";
                              const statusCategory = issue.fields?.status?.statusCategory?.key || "";
                              const priorityName = issue.fields?.priority?.name || "None";
                              const assigneeName = issue.fields?.assignee?.displayName || "Unassigned";

                              const statusColor =
                                statusCategory === "done" ? "bg-green-100 text-green-800" :
                                statusCategory === "indeterminate" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800";

                              const priorityColor =
                                priorityName === "Highest" || priorityName === "Critical" ? "bg-red-100 text-red-800" :
                                priorityName === "High" ? "bg-orange-100 text-orange-800" :
                                priorityName === "Medium" ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800";

                              return (
                                <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <a
                                        href={`https://humanityandb.atlassian.net/browse/${issue.key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                      >
                                        {issue.key}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                      <Badge className={`text-xs ${statusColor}`}>{statusName}</Badge>
                                    </div>
                                    <p className="font-medium text-gray-900 truncate">{issue.fields?.summary}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      <span>{issue.fields?.issuetype?.name || "Issue"}</span>
                                      <span>{assigneeName}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Badge className={`text-xs ${priorityColor}`}>{priorityName}</Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* PMP Recommendations for this program */}
        <div className="mt-6">
          <PMPRecommendationsPanel programId={programId} />
        </div>
      </main>

      {/* Field Edit Dialog for Missing Components */}
      <Dialog open={editingField !== null} onOpenChange={(open) => { if (!open) setEditingField(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField === 'ownerId' ? 'Set Owner' :
               editingField === 'startDate' ? 'Set Start Date' :
               editingField === 'endDate' ? 'Set End Date' :
               editingField === 'description' ? 'Set Description' :
               editingField === 'objectives' ? 'Set Objectives' :
               editingField === 'kpis' ? 'Set KPIs' : 'Edit Field'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingField === 'ownerId' && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Quick Assign</Label>
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    disabled={!userId || updateProgramMutation.isPending}
                    onClick={() => {
                      if (userId) {
                        updateProgramMutation.mutate({ id: programId, data: { ownerId: userId } }, {
                          onSuccess: () => { setEditingField(null); setFieldValue(""); }
                        });
                      }
                    }}
                  >
                    Assign to me
                  </Button>
                </div>
                <div className="relative flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[11px] text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div>
                  <Label htmlFor="field-owner-name" className="mb-2 block">Assign to someone else</Label>
                  <Input
                    id="field-owner-name"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    placeholder="e.g., John Smith"
                    autoFocus
                  />
                  <Button
                    className="w-full mt-2 bg-primary-500 text-white hover:bg-primary-600"
                    disabled={!fieldValue.trim() || updateProgramMutation.isPending}
                    onClick={() => {
                      if (fieldValue.trim()) {
                        updateProgramMutation.mutate({ id: programId, data: { ownerName: fieldValue.trim(), ownerId: null } }, {
                          onSuccess: () => { setEditingField(null); setFieldValue(""); }
                        });
                      }
                    }}
                  >
                    {updateProgramMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}
            {(editingField === 'startDate' || editingField === 'endDate') && (
              <div>
                <Label htmlFor="field-date">{editingField === 'startDate' ? 'Start Date' : 'End Date'}</Label>
                <Input
                  id="field-date"
                  type="date"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            {editingField === 'description' && (
              <div>
                <Label htmlFor="field-description">Description</Label>
                <Textarea
                  id="field-description"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Describe this program..."
                  rows={4}
                  autoFocus
                />
              </div>
            )}
            {editingField === 'objectives' && (
              <div>
                <Label htmlFor="field-objectives">Objectives (one per line)</Label>
                <Textarea
                  id="field-objectives"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Enter each objective on a new line"
                  rows={4}
                  autoFocus
                />
              </div>
            )}
            {editingField === 'kpis' && (
              <div>
                <Label htmlFor="field-kpis">KPIs (one per line)</Label>
                <Textarea
                  id="field-kpis"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Enter each KPI on a new line"
                  rows={4}
                  autoFocus
                />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
              {editingField !== 'ownerId' && (
                <Button
                  className="bg-primary-500 text-white hover:bg-primary-600"
                  disabled={!fieldValue.trim() || updateProgramMutation.isPending}
                  onClick={() => {
                    if (!editingField || !fieldValue.trim()) return;
                    let data: Record<string, any> = {};
                    if (editingField === 'objectives' || editingField === 'kpis') {
                      data[editingField] = fieldValue.split('\n').map(s => s.trim()).filter(Boolean);
                    } else {
                      data[editingField] = fieldValue.trim();
                    }
                    updateProgramMutation.mutate({ id: programId, data }, {
                      onSuccess: () => {
                        setEditingField(null);
                        setFieldValue("");
                      }
                    });
                  }}
                >
                  {updateProgramMutation.isPending ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekly Status Modal */}
      <Dialog open={showWeeklyStatus} onOpenChange={setShowWeeklyStatus}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileBarChart size={18} />
                Weekly Status Report
              </span>
              {weeklyStatusData && (
                <Button variant="outline" size="sm" onClick={handleCopyWeeklyStatus}>
                  <Copy size={14} className="mr-2" />
                  Copy as Markdown
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {weeklyStatusLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : weeklyStatusData ? (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">{weeklyStatusData.summary.programName}</p>
                <p className="text-xs text-gray-500">Status: {weeklyStatusData.summary.status} | Health: {weeklyStatusData.summary.healthScore}%</p>
              </div>
              {weeklyStatusData.completedThisWeek?.length > 0 && (
                <div><h4 className="text-sm font-semibold text-green-700 mb-1">Completed This Week</h4>{weeklyStatusData.completedThisWeek.map((item: any, i: number) => <p key={i} className="text-xs text-gray-600 pl-3">- {item.title}</p>)}</div>
              )}
              {weeklyStatusData.inProgress?.length > 0 && (
                <div><h4 className="text-sm font-semibold text-blue-700 mb-1">In Progress</h4>{weeklyStatusData.inProgress.map((item: any, i: number) => <p key={i} className="text-xs text-gray-600 pl-3">- {item.title} [{item.status}]</p>)}</div>
              )}
              {weeklyStatusData.risksAndBlockers?.criticalHighRisks?.length > 0 && (
                <div><h4 className="text-sm font-semibold text-red-700 mb-1">Risks & Blockers</h4>{weeklyStatusData.risksAndBlockers.criticalHighRisks.map((r: any, i: number) => <p key={i} className="text-xs text-gray-600 pl-3">- [{(r.severity || "").toUpperCase()}] {r.title}</p>)}</div>
              )}
              {weeklyStatusData.overdueItems?.length > 0 && (
                <div><h4 className="text-sm font-semibold text-amber-700 mb-1">Overdue</h4>{weeklyStatusData.overdueItems.map((item: any, i: number) => <p key={i} className="text-xs text-gray-600 pl-3">- {item.title} ({item.daysOverdue}d overdue)</p>)}</div>
              )}
              {weeklyStatusData.nextWeekFocus?.length > 0 && (
                <div><h4 className="text-sm font-semibold text-purple-700 mb-1">Next Week Focus</h4>{weeklyStatusData.nextWeekFocus.map((item: any, i: number) => <p key={i} className="text-xs text-gray-600 pl-3">- {item.title}</p>)}</div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}