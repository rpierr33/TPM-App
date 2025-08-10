import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
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
  Plus
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
              onClick={() => setLocation("/programs")}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Programs
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
        <Tabs defaultValue="stakeholders" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
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

          {/* Other tabs content - simplified for now */}
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">{programRisks.length}</div>
                    <div className="text-sm text-gray-600">Risks</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{programMilestones.length}</div>
                    <div className="text-sm text-gray-600">Milestones</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">{programDependencies.length}</div>
                    <div className="text-sm text-gray-600">Dependencies</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{programAdopters.length}</div>
                    <div className="text-sm text-gray-600">Teams</div>
                  </div>
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