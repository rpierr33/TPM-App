import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { PMPRecommendationsPanel } from "@/components/pmp/PMPRecommendationsPanel";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MissingComponentsModal } from "@/components/modals/MissingComponentsModal";
import { Progress } from "@/components/ui/progress";
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
  Users,
  GitBranch,
  Calendar,
  ArrowRight,
  Eye,
  Clock,
  CheckCircle,
  Target,
  FileText,
  Play,
  ChevronRight,
  Plus,
  Pause,
  ExternalLink,
  Pencil,
  Megaphone,
  Check,
  X
} from "lucide-react";
import { calculateProgramHealth, getHealthBadge } from "@/lib/healthCalculation";
import { useAppStore } from "@/stores/appStore";
import type { Program, Risk, Milestone, Adopter, Dependency, JiraEpic, JiraBepic, JiraStory, Escalation, Report } from "@shared/schema";

export default function Dashboard() {
  const dashboardPrefs = useAppStore((s) => s.dashboardPrefs);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showMissingComponentsModal, setShowMissingComponentsModal] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [showPrioritiesModal, setShowPrioritiesModal] = useState(false);
  const [showAIRecommendationsModal, setShowAIRecommendationsModal] = useState(false);
  const [newProgramForm, setNewProgramForm] = useState({
    name: "",
    description: "",
    status: "planning" as const,
    platform: "",
    initiative: ""
  });
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editingProgramName, setEditingProgramName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  
  // Auto-generate missing component risks on component mount
  useEffect(() => {
    const generateMissingRisks = async () => {
      try {
        // Run comprehensive gap detection (includes missing components + other gaps)
        await apiRequest('/api/programs/detect-all-gaps', 'POST');
        console.log('Comprehensive gap detection completed for all programs');
        // Refresh risks data to show the new auto-generated risks
        queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      } catch (error) {
        console.error('Failed to run gap detection:', error);
      }
    };
    
    // Only run once when component mounts
    generateMissingRisks();
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

  const { data: adopters = [] } = useQuery<Adopter[]>({
    queryKey: ["/api/adopters"],
  });

  const { data: dependencies = [] } = useQuery<Dependency[]>({
    queryKey: ["/api/dependencies"],
  });

  const { data: jiraEpics = [] } = useQuery<JiraEpic[]>({
    queryKey: ["/api/jira-epics"],
  });

  const { data: jiraBepics = [] } = useQuery<JiraBepic[]>({
    queryKey: ["/api/jira-bepics"],
  });

  const { data: jiraStories = [] } = useQuery<JiraStory[]>({
    queryKey: ["/api/jira-stories"],
  });

  const { data: milestoneSteps = [] } = useQuery<any[]>({
    queryKey: ["/api/milestone-steps"],
  });

  const { data: escalations = [] } = useQuery<Escalation[]>({
    queryKey: ["/api/escalations"],
  });

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const activePendingPrograms = programs.filter(p => p.status === 'active' || p.status === 'planning');
  const completedPrograms = programs.filter(p => p.status === 'completed');
  const onHoldPrograms = programs.filter(p => p.status === 'on_hold');

  // Generate today's priorities based on program health analysis
  const generateTodaysPriorities = () => {
    const priorities: Array<{type: string; title: string; description: string; priority?: string; pmiReference?: string; urgency?: string; action?: string}> = [];
    
    // Critical risks that need immediate attention
    const criticalRisks = risks.filter(r => r.severity === 'critical' || r.severity === 'high').slice(0, 3);
    criticalRisks.forEach(risk => {
      const program = programs.find(p => p.id === risk.programId);
      priorities.push({
        type: 'risk',
        title: `Address ${risk.severity} risk in ${program?.name || 'Unknown Program'}`,
        description: risk.title,
        urgency: 'critical',
        action: 'Review mitigation plan and assign owners'
      });
    });

    // Overdue milestones
    const overdueMilestones = milestones.filter(m => {
      if (!m.dueDate) return false;
      const dueDate = new Date(m.dueDate);
      return dueDate < new Date() && m.status !== 'completed';
    }).slice(0, 3);
    
    overdueMilestones.forEach(milestone => {
      const program = programs.find(p => p.id === milestone.programId);
      priorities.push({
        type: 'milestone',
        title: `Overdue milestone in ${program?.name || 'Unknown Program'}`,
        description: milestone.title,
        urgency: 'high',
        action: 'Update timeline and communicate delays'
      });
    });

    // Programs missing critical components
    programs.forEach(program => {
      const programRisks = risks.filter(r => r.programId === program.id);
      const programMilestones = milestones.filter(m => m.programId === program.id);
      const programAdopters = adopters.filter(a => a.programId === program.id);
      
      if (program.status === 'active' && (programRisks.length === 0 || programMilestones.length === 0)) {
        priorities.push({
          type: 'completeness',
          title: `${program.name} missing critical components`,
          description: `Missing: ${programRisks.length === 0 ? 'Risk Assessment' : ''} ${programMilestones.length === 0 ? 'Milestones' : ''}`.trim(),
          urgency: 'medium',
          action: 'Complete program setup to ensure proper tracking'
        });
      }
    });

    return priorities.slice(0, 8); // Top 8 priorities
  };

  // Generate PMI-based recommendations
  const generatePMIRecommendations = () => {
    const recommendations = [];
    
    // Analyze ALL programs (not just active ones) for completeness
    programs.forEach(program => {
      const programRisks = risks.filter(r => r.programId === program.id);
      const programMilestones = milestones.filter(m => m.programId === program.id);
      const programDependencies = dependencies.filter(d => d.programId === program.id);
      const programAdopters = adopters.filter(a => a.programId === program.id);
      
      // Initiating Process Group - Program Charter & Documentation
      if (!program.description || program.description.length < 50) {
        recommendations.push({
          category: 'Initiating',
          title: `Develop Program Charter for ${program.name}`,
          description: 'PMI requires comprehensive program charter with clear scope, objectives, and success criteria',
          pmiReference: 'PMBOK 7th Edition - Project Charter Development',
          priority: 'high'
        });
      }

      if (!program.ownerId) {
        recommendations.push({
          category: 'Initiating',
          title: `Assign Program Manager for ${program.name}`,
          description: 'PMI mandates clear ownership and accountability through designated program leadership',
          pmiReference: 'PMBOK - Project Manager Role Definition',
          priority: 'high'
        });
      }

      if (!program.startDate) {
        recommendations.push({
          category: 'Initiating',
          title: `Define Start Date for ${program.name}`,
          description: 'PMI requires clear timeline boundaries for proper program initiation',
          pmiReference: 'PMBOK - Schedule Management Planning',
          priority: 'medium'
        });
      }

      if (!program.endDate) {
        recommendations.push({
          category: 'Initiating',
          title: `Establish End Date for ${program.name}`,
          description: 'PMI emphasizes time-bound objectives for successful program closure',
          pmiReference: 'PMBOK - Schedule Management Planning',
          priority: 'medium'
        });
      }

      // Planning Process Group - Work Breakdown & Risk Management
      if (programMilestones.length === 0) {
        recommendations.push({
          category: 'Planning',
          title: `Create Work Breakdown Structure for ${program.name}`,
          description: 'PMI requires detailed milestone planning and work decomposition',
          pmiReference: 'PMBOK - Work Breakdown Structure',
          priority: 'critical'
        });
      }

      if (programRisks.length === 0) {
        recommendations.push({
          category: 'Planning',
          title: `Conduct Risk Assessment for ${program.name}`,
          description: 'PMI mandates proactive risk identification and management planning',
          pmiReference: 'PMBOK - Risk Management Process',
          priority: 'high'
        });
      }

      if (!program.objectives || (Array.isArray(program.objectives) && program.objectives.length === 0)) {
        recommendations.push({
          category: 'Planning',
          title: `Define SMART Objectives for ${program.name}`,
          description: 'PMI requires specific, measurable, achievable, relevant, time-bound objectives',
          pmiReference: 'PMBOK - Scope Management',
          priority: 'high'
        });
      }

      if (!program.kpis || (Array.isArray(program.kpis) && program.kpis.length === 0)) {
        recommendations.push({
          category: 'Planning',
          title: `Establish KPIs for ${program.name}`,
          description: 'PMI emphasizes measurable success criteria and performance indicators',
          pmiReference: 'PMBOK - Quality Management',
          priority: 'medium'
        });
      }

      // Executing Process Group - Stakeholder & Resource Management
      if (programAdopters.length === 0) {
        recommendations.push({
          category: 'Executing',
          title: `Identify Stakeholders for ${program.name}`,
          description: 'PMI requires comprehensive stakeholder identification and engagement planning',
          pmiReference: 'PMBOK - Stakeholder Management',
          priority: 'high'
        });
      }

      if (programDependencies.length === 0) {
        recommendations.push({
          category: 'Planning',
          title: `Map Dependencies for ${program.name}`,
          description: 'PMI emphasizes dependency identification for critical path management',
          pmiReference: 'PMBOK - Schedule Management',
          priority: 'medium'
        });
      }

      // Monitoring & Controlling - Active Risk Management
      const criticalRisks = programRisks.filter(r => r.severity === 'critical' || r.severity === 'high');
      if (criticalRisks.length > 0) {
        recommendations.push({
          category: 'Monitoring',
          title: `Implement Risk Response Plans for ${program.name}`,
          description: 'PMI requires immediate response strategies for high-impact risks',
          pmiReference: 'PMBOK - Risk Response Implementation',
          priority: 'critical'
        });
      }

      // Communication Management
      const blockedDependencies = programDependencies.filter(d => d.status === 'blocked');
      if (blockedDependencies.length > 0) {
        recommendations.push({
          category: 'Executing',
          title: `Resolve Blocked Dependencies in ${program.name}`,
          description: 'PMI emphasizes clear communication and escalation for dependency resolution',
          pmiReference: 'PMBOK - Communications Management',
          priority: 'critical'
        });
      }
    });

    // Portfolio-Level PMI Recommendations
    if (programs.length > 2) {
      recommendations.push({
        category: 'Integration',
        title: 'Establish Program Management Office (PMO)',
        description: 'PMI recommends PMO governance for portfolio consistency and standardization',
        pmiReference: 'PMI - Program Management Standard',
        priority: 'medium'
      });
    }

    // Quality Assurance
    const programsWithoutProperDocumentation = programs.filter(p => 
      !p.description || p.description.length < 50 || !p.objectives || !p.kpis
    );
    
    if (programsWithoutProperDocumentation.length > 0) {
      recommendations.push({
        category: 'Quality',
        title: 'Standardize Program Documentation',
        description: 'PMI requires consistent documentation standards across all programs',
        pmiReference: 'PMBOK - Quality Management',
        priority: 'medium'
      });
    }

    // Risk Management Portfolio View
    const totalRisks = risks.length;
    const totalPrograms = programs.length;
    if (totalPrograms > 0 && (totalRisks / totalPrograms) < 2) {
      recommendations.push({
        category: 'Planning',
        title: 'Enhance Portfolio Risk Assessment',
        description: 'PMI recommends comprehensive risk identification across all programs',
        pmiReference: 'PMBOK - Portfolio Risk Management',
        priority: 'high'
      });
    }

    // Sort by priority and return top recommendations
    const priorityOrder: Record<string, number> = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return recommendations
      .sort((a, b) => (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0))
      .slice(0, 15); // Top 15 recommendations
  };

  const analyzeProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      return await apiRequest("/api/analyze-program", "POST", { programId });
    },
    onSuccess: (data: any, programId: string) => {
      const program = programs.find(p => p.id === programId);
      const analysis = data.analysis?.[0];
      if (analysis && program) {
        setSelectedProgram(program);
        setAnalysisData(analysis);
        setShowMissingComponentsModal(true);
        
        toast({
          title: `${program.name} Analysis Complete`,
          description: `Found ${analysis.riskAlerts?.length || 0} missing components. Opening detailed view...`,
          variant: analysis.riskAlerts?.length > 0 ? "destructive" : "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze program at this time",
        variant: "destructive"
      });
    }
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
      // Refresh programs list
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

  const renameProgramMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiRequest(`/api/programs/${id}`, "PATCH", { name });
    },
    onSuccess: () => {
      toast({ title: "Renamed", description: "Program name updated" });
      setEditingProgramId(null);
      qc.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to rename program", variant: "destructive" });
      setEditingProgramId(null);
    },
  });

  const startEditing = (program: Program) => {
    setEditingProgramId(program.id);
    setEditingProgramName(program.name);
  };

  const commitRename = (programId: string) => {
    const trimmed = editingProgramName.trim();
    if (!trimmed) {
      setEditingProgramId(null);
      return;
    }
    renameProgramMutation.mutate({ id: programId, name: trimmed });
  };

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

  const handleCheckRisks = (programId: string) => {
    analyzeProgramMutation.mutate(programId);
  };

  const handleNavigateToComponent = (component: string, programId: string) => {
    switch (component) {
      case 'Milestones':
        toast({
          title: "No Milestones Found",
          description: "This program has no milestones. Navigate to Milestones page to add some.",
          variant: "default",
        });
        setLocation('/milestones');
        break;
      case 'Risks':
        toast({
          title: "No Additional Risks Found", 
          description: "Navigate to Risk Management to add more risks for this program.",
          variant: "default",
        });
        setLocation('/risk-management');
        break;
      case 'Dependencies':
        toast({
          title: "No Dependencies Found",
          description: "This program has no dependencies. Navigate to Dependencies page to add some.",
          variant: "default",
        });
        setLocation('/dependencies');
        break;
      case 'Adopters':
        toast({
          title: "No Adopter Teams Found",
          description: "This program has no adopter teams. Navigate to Adopter Support to add some.",
          variant: "default",
        });
        setLocation('/adopter-support');
        break;
      default:
        toast({
          title: `Missing ${component}`,
          description: `This program is missing ${component}. This component needs to be added for completeness.`,
          variant: "default",
        });
    }
  };

  const getProgramRisks = (programId: string) => {
    return risks.filter(r => r.programId === programId);
  };

  const getProgramMilestones = (programId: string) => {
    return milestones.filter(m => m.programId === programId);
  };

  const getProgramAdopters = (programId: string) => {
    return adopters.filter(a => a.programId === programId);
  };

  const getProgramDependencies = (programId: string) => {
    return dependencies.filter(d => d.programId === programId);
  };

  // Helper function to calculate program completeness
  const getProgramCompleteness = (programId: string) => {
    const programRisks = risks.filter(r => r.programId === programId);
    const programMilestones = milestones.filter(m => m.programId === programId);
    const programDependencies = dependencies.filter(d => d.programId === programId);
    const programAdopters = adopters.filter(a => a.programId === programId);
    
    const programMilestoneIds = programMilestones.map(m => m.id);
    const programStepIds = milestoneSteps.filter(s => 
      programMilestoneIds.includes(s.milestoneId || "")
    ).map(s => s.id);
    
    const programBepics = jiraBepics.filter(b => programMilestoneIds.includes(b.milestoneId || ""));
    const programBepicIds = programBepics.map(b => b.id);
    const programEpics = jiraEpics.filter(e => programBepicIds.includes(e.bepicId || ""));
    const programEpicIds = programEpics.map(e => e.id);
    const programStories = jiraStories.filter(s => programEpicIds.includes(s.epicId || ""));
    
    const program = programs.find(p => p.id === programId);
    
    const requiredComponents = [
      { name: 'Description', exists: !!program?.description },
      { name: 'Start Date', exists: !!program?.startDate },
      { name: 'End Date', exists: !!program?.endDate },
      { name: 'Milestones', exists: programMilestones.length > 0 },
      { name: 'Risks', exists: programRisks.length > 0 },
      { name: 'Dependencies', exists: programDependencies.length > 0 },
      { name: 'Adopters', exists: programAdopters.length > 0 },
      { name: 'Business Epics', exists: programBepics.length > 0 },
      { name: 'Epics', exists: programEpics.length > 0 },
      { name: 'Stories', exists: programStories.length > 0 }
    ];
    
    const completed = requiredComponents.filter(c => c.exists).length;
    const total = requiredComponents.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const missing = requiredComponents.filter(c => !c.exists);
    
    return {
      percentage,
      completed,
      total,
      missing,
      requiredComponents
    };
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  // Helper function to determine current PMP phase and next steps
  const getProgramPhase = (program: Program) => {
    switch (program.status?.toLowerCase()) {
      case 'planning': return { 
        name: 'Planning', 
        icon: <FileText size={16} />, 
        color: 'text-blue-600',
        nextStep: 'Complete scope definition and work breakdown structure'
      };
      case 'active': return { 
        name: 'Executing', 
        icon: <Play size={16} />, 
        color: 'text-green-600',
        nextStep: 'Monitor team performance and deliverable quality'
      };
      case 'completed': return { 
        name: 'Closed', 
        icon: <CheckCircle size={16} />, 
        color: 'text-gray-600',
        nextStep: 'Archive project documents and capture lessons learned'
      };
      case 'on_hold': return { 
        name: 'On Hold', 
        icon: <Clock size={16} />, 
        color: 'text-yellow-600',
        nextStep: 'Review hold reasons and develop resumption plan'
      };
      default: return { 
        name: 'Initiation', 
        icon: <Target size={16} />, 
        color: 'text-purple-600',
        nextStep: 'Develop project charter and identify stakeholders'
      };
    }
  };

  // Calculate overall metrics for AI Insights section
  const overallMetrics = {
    totalPrograms: programs.length,
    activePrograms: programs.filter(p => p.status === 'active' || p.status === 'planning').length,
    criticalRisks: risks.filter(r => r.severity === 'critical' || r.severity === 'high').length,
    overdueMilestones: milestones.filter(m => 
      m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed'
    ).length
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title="Program Dashboard"
        subtitle="Prioritized view — what needs your attention now"
        onNewClick={handleNewProgram}
      />

      <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* Today's Focus: AI Briefing + Sequenced Action Items */}
        <TodaysFocus />

        {/* Program Snapshot Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 tracking-tight">Program Snapshot</h2>
              <p className="text-xs text-gray-500 mt-0.5">Overview of all programs across platforms and initiatives</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300">
                <option>All Platforms</option>
                <option>Platform A</option>
                <option>Platform B</option>
                <option>Platform C</option>
              </select>
              <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300">
                <option>All Initiatives</option>
                <option>Digital Transformation</option>
                <option>Cloud Migration</option>
                <option>Customer Experience</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricsCard
              title="Active Programs"
              value={activePendingPrograms.length}
              change={`${programs.length} total`}
              changeType="neutral"
              icon={ChartGantt}
              iconColor="bg-emerald-500"
              navigateTo="/programs?filter=active"
            />
            <MetricsCard
              title="Programs on Hold"
              value={onHoldPrograms.length}
              change="currently paused"
              changeType="neutral"
              icon={AlertTriangle}
              iconColor="bg-amber-500"
              navigateTo="/programs?filter=on_hold"
            />
            <MetricsCard
              title="All Risks"
              value={risks.length}
              change="across programs"
              changeType="neutral"
              icon={AlertTriangle}
              iconColor="bg-red-500"
              navigateTo="/risk-management"
            />
            <MetricsCard
              title="Dependencies"
              value={dependencies.length}
              change="cross-program"
              changeType="neutral"
              icon={GitBranch}
              iconColor="bg-violet-500"
              navigateTo="/dependencies"
            />
          </div>
        </div>

        {/* Recently Visited Programs Section */}
        <div className="mb-6" id="active-programs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 tracking-tight">Programs by Priority</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sorted by urgency — overdue items, critical risks, blocked dependencies</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/programs")}
                className="text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View All
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                      </div>
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
                <p className="text-gray-500 mb-4">Create your first program to start tracking progress and managing initiatives.</p>
                <Button onClick={handleNewProgram} className="bg-primary-500 text-white hover:bg-primary-600">
                  Create First Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="max-h-[480px] overflow-y-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 custom-scrollbar pr-1">
              {programs
                .sort((a, b) => {
                  // Sort by urgency: programs with overdue items + critical risks first
                  const aOverdue = milestones.filter(m => m.programId === a.id && m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed').length;
                  const bOverdue = milestones.filter(m => m.programId === b.id && m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed').length;
                  const aCritical = risks.filter(r => r.programId === a.id && (r.severity === 'critical' || r.severity === 'high')).length;
                  const bCritical = risks.filter(r => r.programId === b.id && (r.severity === 'critical' || r.severity === 'high')).length;
                  const aScore = (aOverdue * 3) + (aCritical * 2);
                  const bScore = (bOverdue * 3) + (bCritical * 2);
                  if (bScore !== aScore) return bScore - aScore;
                  return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
                })
                .map((program) => {
                const programRisks = getProgramRisks(program.id);
                const programMilestones = getProgramMilestones(program.id);
                const programAdopters = getProgramAdopters(program.id);
                const programDependencies = getProgramDependencies(program.id);
                
                const criticalRisks = programRisks.filter(r => r.severity === 'critical' || r.severity === 'high');
                const overdueMilestones = programMilestones.filter(m => 
                  m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed'
                );
                const blockedDependencies = programDependencies.filter(d => d.status === 'blocked');

                // Calculate missing components for health scoring - MUST MATCH PROGRAM DETAILS EXACTLY
                const getMissingComponents = () => {
                  const missing = [];
                  if (!program.description || program.description.trim().length < 10) missing.push('Description');
                  if (!program.ownerId) missing.push('Owner');
                  if (!program.startDate) missing.push('Start Date');
                  if (!program.endDate) missing.push('End Date');
                  if (!program.objectives || (Array.isArray(program.objectives) && !program.objectives.length)) missing.push('Objectives');
                  if (!program.kpis || (Array.isArray(program.kpis) && !program.kpis.length)) missing.push('KPIs');
                  if (programRisks.length === 0) missing.push('Risks');
                  if (programMilestones.length === 0) missing.push('Milestones');
                  if (programAdopters.length === 0) missing.push('Adopter Teams');
                  return missing;
                };

                const missingComponents = getMissingComponents();

                // Calculate program health using centralized utility
                const healthMetrics = calculateProgramHealth({
                  risks: programRisks,
                  milestones: programMilestones,
                  dependencies: programDependencies,
                  missingComponents: missingComponents.length
                });

                const healthBadge = getHealthBadge(healthMetrics.score);

                return (
                  <Card
                    key={program.id}
                    className="border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => setLocation(`/programs/${program.id}`)}
                  >
                    <CardContent className="p-4">
                      {/* Row 1: Name + Status + Health */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getStatusIcon(program.status || 'active')}
                          {editingProgramId === program.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editingProgramName}
                                onChange={(e) => setEditingProgramName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitRename(program.id);
                                  if (e.key === 'Escape') setEditingProgramId(null);
                                }}
                                onBlur={() => commitRename(program.id)}
                                autoFocus
                                className="h-7 text-sm font-semibold w-40"
                              />
                              <button onClick={() => commitRename(program.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setEditingProgramId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{program.name}</h3>
                              <button
                                onClick={(e) => { e.stopPropagation(); startEditing(program); }}
                                className="p-0.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                title="Rename"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <Badge className={`${getStatusColor(program.status || 'active')} text-[10px] flex-shrink-0`}>
                            {program.status?.replace('_', ' ') || 'active'}
                          </Badge>
                        </div>
                        <Badge className={`${healthBadge.color} text-[10px] flex-shrink-0 ml-2`}>
                          {healthBadge.label}
                        </Badge>
                      </div>

                      {/* Row 2: Compact inline stats */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className={`h-3 w-3 ${criticalRisks.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                          <span className={criticalRisks.length > 0 ? 'text-red-600 font-medium' : ''}>{programRisks.length} risks</span>
                          {criticalRisks.length > 0 && <span className="text-red-500">({criticalRisks.length} critical)</span>}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <Flag className={`h-3 w-3 ${overdueMilestones.length > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                          <span className={overdueMilestones.length > 0 ? 'text-amber-600 font-medium' : ''}>{programMilestones.length} milestones</span>
                          {overdueMilestones.length > 0 && <span className="text-amber-500">({overdueMilestones.length} overdue)</span>}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <GitBranch className={`h-3 w-3 ${blockedDependencies.length > 0 ? 'text-purple-500' : 'text-gray-400'}`} />
                          <span>{programDependencies.length} deps</span>
                        </span>
                      </div>

                      {/* Row 3: Alert banner (only if something needs attention) */}
                      {(criticalRisks.length > 0 || overdueMilestones.length > 0 || missingComponents.length > 3) && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="text-amber-600 truncate">
                            {[
                              criticalRisks.length > 0 && `${criticalRisks.length} critical risks`,
                              overdueMilestones.length > 0 && `${overdueMilestones.length} overdue`,
                              missingComponents.length > 3 && `${missingComponents.length} missing components`,
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Programs Summary */}
        {(completedPrograms.length > 0 || onHoldPrograms.length > 0) && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-4">Other Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedPrograms.length > 0 && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Completed Programs ({completedPrograms.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {completedPrograms.slice(0, 3).map(program => (
                        <div key={program.id} className="flex items-center justify-between py-2">
                          <span
                            className="text-sm text-primary-700 hover:underline cursor-pointer"
                            onClick={() => setLocation(`/programs/${program.id}`)}
                          >
                            {program.name}
                          </span>
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        </div>
                      ))}
                      {completedPrograms.length > 3 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          {completedPrograms.length - 3} more completed programs
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {onHoldPrograms.length > 0 && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      On Hold Programs ({onHoldPrograms.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {onHoldPrograms.slice(0, 3).map(program => (
                        <div key={program.id} className="flex items-center justify-between py-2">
                          <span
                            className="text-sm text-primary-700 hover:underline cursor-pointer"
                            onClick={() => setLocation(`/programs/${program.id}`)}
                          >
                            {program.name}
                          </span>
                          <Badge className="bg-yellow-100 text-yellow-800">On Hold</Badge>
                        </div>
                      ))}
                      {onHoldPrograms.length > 3 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          {onHoldPrograms.length - 3} more on hold programs
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}



        {/* AI Insights Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 tracking-tight">AI Insights & Recommendations</h2>
              <p className="text-xs text-gray-500 mt-0.5">AI-powered analysis and prioritized actions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Today's Priorities */}
            <Card className="border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setShowPrioritiesModal(true)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Today's Priorities</h3>
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {overallMetrics.overdueMilestones + overallMetrics.criticalRisks}
                </div>
                <div className="text-sm text-gray-500">Critical items</div>
              </CardContent>
            </Card>

            {/* Risk Alerts */}
            <Card className="border border-gray-200 cursor-pointer hover:border-red-300 transition-colors" onClick={() => setLocation("/risk-management")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Risk Alerts</h3>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">{overallMetrics.criticalRisks}</div>
                <div className="text-sm text-gray-500">Critical risks</div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="border border-gray-200 cursor-pointer hover:border-yellow-300 transition-colors" onClick={() => setShowAIRecommendationsModal(true)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">PMI Suggestions</h3>
                  <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {Math.max(3, Math.floor(overallMetrics.totalPrograms * 0.5))}
                </div>
                <div className="text-sm text-gray-500">PMI Recommendations</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Escalations & Reports Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <Card className="border border-orange-200 hover:border-orange-400 transition-colors cursor-pointer" onClick={() => setLocation("/escalations")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Open Escalations</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {escalations.filter((e: Escalation) => e.status !== 'resolved' && e.status !== 'closed').length}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700" onClick={(e) => { e.stopPropagation(); setLocation("/escalations"); }}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-indigo-200 hover:border-indigo-400 transition-colors cursor-pointer" onClick={() => setLocation("/executive-reports?tab=reports")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Generated Reports</div>
                  <div className="text-2xl font-bold text-indigo-600">{reports.length}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.stopPropagation(); setLocation("/executive-reports?tab=reports"); }}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation to Components */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/risk-management")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">All Risks</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation("/milestones")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
          >
            <Flag className="h-5 w-5" />
            <span className="text-sm">All Milestones</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation("/dependencies")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <GitBranch className="h-5 w-5" />
            <span className="text-sm">Dependencies</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation("/escalations")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <Megaphone className="h-5 w-5" />
            <span className="text-sm">Escalations</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation("/executive-reports?tab=reports")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm">Reports</span>
          </Button>
        </div>

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

      {/* Today's Priorities Modal */}
      <Dialog open={showPrioritiesModal} onOpenChange={setShowPrioritiesModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Today's Priorities
            </DialogTitle>
            <p className="text-sm text-gray-600">Critical items requiring immediate attention based on program health analysis</p>
          </DialogHeader>
          <div className="space-y-4">
            {generateTodaysPriorities().map((priority, index) => (
              <Card
                key={index}
                className="border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
                onClick={() => {
                  setShowPrioritiesModal(false);
                  if (priority.type === 'risk') setLocation('/risk-management');
                  else if (priority.type === 'milestone') setLocation('/milestones');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {priority.type === 'risk' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {priority.type === 'milestone' && <Clock className="h-4 w-4 text-orange-500" />}
                      {priority.type === 'completeness' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                      <h4 className="font-medium text-gray-900">{priority.title}</h4>
                    </div>
                    <Badge className={
                      priority.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                      priority.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {priority.urgency}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{priority.description}</p>
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Action: {priority.action}
                  </div>
                </CardContent>
              </Card>
            ))}
            {generateTodaysPriorities().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p>No critical priorities at this time. All programs are on track!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PMI Recommendations Modal */}
      <Dialog open={showAIRecommendationsModal} onOpenChange={setShowAIRecommendationsModal}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              </div>
              PMI-Based Recommendations
            </DialogTitle>
            <p className="text-sm text-gray-600">Suggestions based on Project Management Institute (PMI) best practices to improve program health</p>
          </DialogHeader>
          <div className="space-y-4">
            {generatePMIRecommendations().map((rec, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">{rec.category.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{rec.category} Process</span>
                      </div>
                    </div>
                    <Badge className={
                      rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <div className="text-xs text-gray-500 italic">
                    PMI Reference: {rec.pmiReference}
                  </div>
                </CardContent>
              </Card>
            ))}
            {generatePMIRecommendations().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p>All programs are following PMI best practices!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}