import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
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
  Plus,
  Flag,
  ChartGantt,
  Activity,
  BarChart3,
  FileText,
  Link2,
  Gauge
} from "lucide-react";

interface ProgramDetailsProps {
  programId: string;
}

export default function ProgramDetails({ programId }: ProgramDetailsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch program data
  const { data: programs = [] } = useQuery({ queryKey: ["/api/programs"] });
  const { data: stakeholders = [] } = useQuery({ queryKey: ["/api/stakeholders"] });
  const { data: risks = [] } = useQuery({ queryKey: ["/api/risks"] });
  const { data: milestones = [] } = useQuery({ queryKey: ["/api/milestones"] });
  const { data: dependencies = [] } = useQuery({ queryKey: ["/api/dependencies"] });
  const { data: adopters = [] } = useQuery({ queryKey: ["/api/adopters"] });

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

  // Filter data for this program
  const programStakeholders = stakeholders.filter(s => s.programId === programId);
  const programRisks = risks.filter(r => r.programId === programId);
  const programMilestones = milestones.filter(m => m.programId === programId);
  const programDependencies = dependencies.filter(d => d.programId === programId);
  const programAdopters = adopters.filter(a => a.programId === programId);

  // Calculate missing components for health scoring
  const getMissingComponents = () => {
    const missing = [];
    if (!program.description || program.description.trim().length < 10) missing.push('Description');
    if (!program.ownerId) missing.push('Owner');
    if (!program.startDate) missing.push('Start Date');
    if (!program.endDate) missing.push('End Date');
    if (!program.objectives || (Array.isArray(program.objectives) && !program.objectives.length)) missing.push('Objectives');
    if (!program.kpis || (Array.isArray(program.kpis) && !program.kpis.length)) missing.push('KPIs');
    if (programMilestones.length === 0) missing.push('Milestones');
    return missing;
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
    <div className="flex-1 flex flex-col overflow-hidden">
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
              <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
              <p className="text-gray-600 mt-1">{program.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`border ${program.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
              {program.status || 'planning'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Program Snapshot</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="adopters">Team Adoption</TabsTrigger>
            <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          </TabsList>

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
                      <p><strong>{programStakeholders.length}</strong> stakeholders identified</p>
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
                          // TODO: Navigate to stakeholder form/wizard
                          toast({
                            title: "Feature Coming Soon",
                            description: "Stakeholder management wizard will be available shortly.",
                          });
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
                                  <h4 className="font-medium text-gray-900">{stakeholder.name}</h4>
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

          <TabsContent value="adopters" className="space-y-6 mt-6">
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
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{programAdopters.length}</div>
                      <div className="text-sm text-gray-600">Teams Adopting</div>
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
                                  <h4 className="font-medium text-gray-900">{adopter.teamName}</h4>
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
                                    {adopter.blockers.map((blocker, index) => (
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
          </TabsContent>

          <TabsContent value="overview" className="space-y-6 mt-6">
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
                      <p>• {healthMetrics.breakdown.criticalRisks} high-severity risks</p>
                      <p>• {healthMetrics.breakdown.overdueMilestones} overdue milestones</p>
                      <p>• {healthMetrics.breakdown.blockedDependencies} blocked dependencies</p>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Risks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{programRisks.length}</Badge>
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          {programRisks.filter(r => r.severity === 'high' || r.severity === 'critical').length} high
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Milestones</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{programMilestones.length}</Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {programMilestones.filter(m => m.status === 'completed').length} done
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChartGantt className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">Dependencies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{programDependencies.length}</Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          {programDependencies.filter(d => d.status === 'blocked').length} blocked
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Stakeholders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{programStakeholders.length}</Badge>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
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
                            <span className="text-sm font-medium">{milestone.title}</span>
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
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700">
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
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700">
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
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700">
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
                          <h4 className="font-medium">{risk.title}</h4>
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
                          <h4 className="font-medium">{milestone.title}</h4>
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
                          <h4 className="font-medium">{dependency.title}</h4>
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
        </Tabs>
      </main>
    </div>
  );
}