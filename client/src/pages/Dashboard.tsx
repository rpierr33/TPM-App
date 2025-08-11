import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MissingComponentsModal } from "@/components/modals/MissingComponentsModal";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { calculateProgramHealth, getHealthBadge } from "@/lib/healthCalculation";
import type { Program, Risk, Milestone, Adopter, Dependency, JiraEpic, JiraBepic, JiraStory } from "@shared/schema";

export default function Dashboard() {
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const activePendingPrograms = programs.filter(p => p.status === 'active' || p.status === 'planning');
  const completedPrograms = programs.filter(p => p.status === 'completed');
  const onHoldPrograms = programs.filter(p => p.status === 'on_hold');

  // Generate today's priorities based on program health analysis
  const generateTodaysPriorities = () => {
    const priorities = [];
    
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
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return recommendations
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
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
    
    const programBepics = jiraBepics.filter(b => programStepIds.includes(b.stepId || ""));
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Program Dashboard"
        subtitle="Overview of all active programs and initiatives"
        onNewClick={handleNewProgram}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Program Snapshot Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Program Snapshot</h2>
              <p className="text-xs text-gray-600">Overview of all programs across platforms and initiatives</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white">
                <option>All Platforms</option>
                <option>Platform A</option>
                <option>Platform B</option>
                <option>Platform C</option>
              </select>
              <select className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white">
                <option>All Initiatives</option>
                <option>Digital Transformation</option>
                <option>Cloud Migration</option>
                <option>Customer Experience</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 mb-3">
            <MetricsCard
              title="Active Programs"
              value={activePendingPrograms.length}
              change={`${programs.length} total`}
              changeType="neutral"
              icon={ChartGantt}
              iconColor="bg-green-100"
              navigateTo="/programs?filter=active"
            />
            <MetricsCard
              title="Programs on Hold"
              value={onHoldPrograms.length}
              change="currently paused"
              changeType="neutral"
              icon={AlertTriangle}
              iconColor="bg-yellow-100"
              navigateTo="/programs?filter=on_hold"
            />
            <MetricsCard
              title="All Risks"
              value={risks.length}
              change="across programs"
              changeType="neutral"
              icon={AlertTriangle}
              iconColor="bg-red-100"
              navigateTo="/risk-management"
            />
            <MetricsCard
              title="Dependencies"
              value={dependencies.length}
              change="cross-program"
              changeType="neutral"
              icon={GitBranch}
              iconColor="bg-purple-100"
              navigateTo="/dependencies"
            />
            <Button 
              variant="outline" 
              onClick={() => setLocation("/programs")}
              className="h-10 flex flex-col items-center justify-center gap-0.5 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs px-2"
            >
              <Eye className="h-3 w-3" />
              <span>View All</span>
            </Button>
            <Button 
              onClick={handleNewProgram}
              className="h-10 flex flex-col items-center justify-center gap-0.5 bg-primary-600 text-white hover:bg-primary-700 text-xs px-2"
            >
              <Plus className="h-3 w-3" />
              <span>New</span>
            </Button>
          </div>
        </div>

        {/* Recently Visited Programs Section */}
        <div className="mb-8" id="active-programs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Programs</h2>
              <p className="text-sm text-gray-600">Recently updated programs</p>
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
            <div className="max-h-96 overflow-y-auto space-y-4 custom-scrollbar">
              {programs
                .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
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
                  <Card key={program.id} className="border border-gray-200 hover:border-primary-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(program.status || 'active')}
                            <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                            <Badge className={getStatusColor(program.status || 'active')}>
                              {program.status?.replace('_', ' ') || 'active'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Owner: {program.ownerId || 'Unassigned'}</span>
                            {program.startDate && (
                              <span>Started: {new Date(program.startDate).toLocaleDateString()}</span>
                            )}
                            {program.endDate && (
                              <span>Due: {new Date(program.endDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Program Health</div>
                          <Badge className={healthBadge.color}>
                            {healthBadge.label} ({healthMetrics.score}%)
                          </Badge>
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">Current Phase</div>
                            <div className={`text-xs font-medium ${getProgramPhase(program).color}`}>
                              {getProgramPhase(program).name}
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Program Components Summary */}
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <button
                          className="text-center p-2 rounded hover:bg-gray-50 transition-colors"
                          onClick={() => setLocation(`/risk-management?programId=${program.id}`)}
                        >
                          <div className="flex items-center justify-center mb-1">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">{programRisks.length}</span>
                          </div>
                          <div className="text-xs text-gray-500">Total Risks</div>
                          {criticalRisks.length > 0 && (
                            <div className="text-xs text-red-600 font-medium">
                              {criticalRisks.length} critical
                            </div>
                          )}
                        </button>

                        <button
                          className="text-center p-2 rounded hover:bg-gray-50 transition-colors"
                          onClick={() => setLocation(`/milestones?programId=${program.id}`)}
                        >
                          <div className="flex items-center justify-center mb-1">
                            <Flag className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">{programMilestones.length}</span>
                          </div>
                          <div className="text-xs text-gray-500">Milestones</div>
                          {overdueMilestones.length > 0 && (
                            <div className="text-xs text-red-600 font-medium">{overdueMilestones.length} overdue</div>
                          )}
                        </button>

                        <button
                          className="text-center p-2 rounded hover:bg-gray-50 transition-colors"
                          onClick={() => setLocation(`/adopter-support?programId=${program.id}`)}
                        >
                          <div className="flex items-center justify-center mb-1">
                            <Users className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">{programAdopters.length}</span>
                          </div>
                          <div className="text-xs text-gray-500">Adopters</div>
                          {programAdopters.filter(a => a.status === 'blocked' || a.status === 'not_started').length > 0 && (
                            <div className="text-xs text-red-600 font-medium">
                              {programAdopters.filter(a => a.status === 'blocked' || a.status === 'not_started').length} need help
                            </div>
                          )}
                        </button>

                        <button
                          className="text-center p-2 rounded hover:bg-gray-50 transition-colors"
                          onClick={() => setLocation(`/dependencies?programId=${program.id}`)}
                        >
                          <div className="flex items-center justify-center mb-1">
                            <GitBranch className="h-4 w-4 text-purple-500 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">{programDependencies.length}</span>
                          </div>
                          <div className="text-xs text-gray-500">Dependencies</div>
                          {blockedDependencies.length > 0 && (
                            <div className="text-xs text-red-600 font-medium">{blockedDependencies.length} blocked</div>
                          )}
                        </button>
                      </div>

                      {/* PMI Phase Next Steps */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          {getProgramPhase(program).icon}
                          <div>
                            <h4 className="text-sm font-medium text-blue-800 mb-1">Next PMI Step</h4>
                            <p className="text-xs text-blue-700">
                              {getProgramPhase(program).nextStep}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Missing Components Alert */}
                      {missingComponents.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-red-800 mb-1">Missing Components</h4>
                              <p className="text-xs text-red-700">
                                This program is missing essential components: {missingComponents.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setLocation(`/programs/${program.id}`)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Programs Summary */}
        {(completedPrograms.length > 0 || onHoldPrograms.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Other Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <span className="text-sm text-gray-700">{program.name}</span>
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
                          <span className="text-sm text-gray-700">{program.name}</span>
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Insights & Recommendations</h2>
              <p className="text-sm text-gray-600">AI-powered analysis and prioritized actions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Quick Navigation to Components */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
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
              <Card key={index} className="border border-gray-200">
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