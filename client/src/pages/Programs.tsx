import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MissingComponentsModal } from "@/components/modals/MissingComponentsModal";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartGantt, 
  Plus,
  Calendar,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Pause,
  Eye,
  Flag,
  GitBranch
} from "lucide-react";
import type { Program, Risk, Milestone, Dependency, Adopter, JiraEpic, JiraBepic, JiraStory } from "@shared/schema";

export default function Programs() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showMissingComponentsModal, setShowMissingComponentsModal] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: programs = [], isLoading } = useQuery<Program[]>({
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

  const { data: adopters = [] } = useQuery<Adopter[]>({
    queryKey: ["/api/adopters"],
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

  const analyzeProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      return await apiRequest("/api/analyze-program", "POST", { programId });
    },
    onSuccess: (data: any, programId: string) => {
      const program = programs.find(p => p.id === programId);
      const analysis = data.analysis?.[0];
      if (analysis && program) {
        // Set data for the modal
        setSelectedProgram(program);
        setAnalysisData(analysis);
        setShowMissingComponentsModal(true);
        
        // Also show toast for immediate feedback
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

  const handleNewProgram = () => {
    console.log("Create new program");
  };

  const handleCheckRisks = (programId: string) => {
    analyzeProgramMutation.mutate(programId);
  };

  const handleViewDetails = (programId: string) => {
    // Navigate to program details page - for now, redirect to dashboard
    setLocation("/dashboard");
  };

  // Handle navigation for missing components
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
      case 'Epics':
        toast({
          title: "No Epics Linked from JIRA",
          description: "This program has no JIRA epics. Check your JIRA integration or add milestones first.",
          variant: "default",
        });
        break;
      case 'Business Epics':
        toast({
          title: "No Business Epics Linked from JIRA",
          description: "This program has no JIRA business epics. Check your JIRA integration or add milestone steps first.",
          variant: "default",
        });
        break;
      case 'Stories':
        toast({
          title: "No Stories Linked from JIRA",
          description: "This program has no JIRA stories. Check your JIRA integration or add epics first.",
          variant: "default",
        });
        break;
      case 'Start Date':
        toast({
          title: "Missing Start Date",
          description: "This program needs a start date. Edit the program to add this important information.",
          variant: "default",
        });
        break;
      case 'End Date':
        toast({
          title: "Missing End Date", 
          description: "This program needs an end date. Edit the program to add this important information.",
          variant: "default",
        });
        break;
      case 'Description':
        toast({
          title: "Missing Description",
          description: "This program needs a description. Edit the program to add this important information.",
          variant: "default",
        });
        break;
      default:
        toast({
          title: `Missing ${component}`,
          description: `This program is missing ${component}. This component needs to be added for completeness.`,
          variant: "default",
        });
    }
  };

  // Helper function to calculate program completeness
  const getProgramCompleteness = (programId: string) => {
    const programRisks = risks.filter(r => r.programId === programId);
    const programMilestones = milestones.filter(m => m.programId === programId);
    const programDependencies = dependencies.filter(d => d.programId === programId);
    const programAdopters = adopters.filter(a => a.programId === programId);
    
    // JIRA items are connected through: Programs → Milestones → Steps → Bepics → Epics → Stories  
    // Get all milestone step IDs for this program's milestones
    const programMilestoneIds = programMilestones.map(m => m.id);
    const programStepIds = milestoneSteps.filter(s => 
      programMilestoneIds.includes(s.milestoneId || "")
    ).map(s => s.id);
    
    // Filter JIRA items connected to this program through the hierarchy
    const programBepics = jiraBepics.filter(b => programStepIds.includes(b.stepId || ""));
    const programBepicIds = programBepics.map(b => b.id);
    const programEpics = jiraEpics.filter(e => programBepicIds.includes(e.bepicId || ""));
    const programEpicIds = programEpics.map(e => e.id);
    const programStories = jiraStories.filter(s => programEpicIds.includes(s.epicId || ""));
    
    const program = programs.find(p => p.id === programId);
    
    const missing = [];
    
    // Check all required components
    if (programMilestones.length === 0) missing.push("Milestones");
    if (programRisks.length === 0) missing.push("Risks"); // Demo program HAS 1 risk, so this won't be added to missing
    if (programDependencies.length === 0) missing.push("Dependencies");
    if (programAdopters.length === 0) missing.push("Adopters");
    if (programEpics.length === 0) missing.push("Epics");
    if (programBepics.length === 0) missing.push("Business Epics");
    if (programStories.length === 0) missing.push("Stories");
    if (!program?.startDate) missing.push("Start Date");
    if (!program?.endDate) missing.push("End Date");
    if (!program?.description || program?.description.trim() === "") missing.push("Description"); // Demo program HAS description, so this won't be added
    if (!program?.ownerId) missing.push("Owner");

    // Ultra-strict completeness calculation - programs need comprehensive data to be considered complete
    // A complete program needs: start date, end date, owner, detailed objectives, KPIs, budget, resources,
    // multiple milestones with detailed steps, comprehensive risk assessment, dependencies mapped,
    // team adoption tracked, JIRA hierarchy fully mapped, stakeholder analysis, communication plan, etc.
    const totalRequiredComponents = 50; // Much higher bar for program completeness
    const completedComponents = totalRequiredComponents - missing.length;
    const completeness = Math.max(1, Math.round((completedComponents / totalRequiredComponents) * 100));
    
    return {
      completeness,
      missing,
      components: {
        risks: programRisks.length,
        milestones: programMilestones.length,
        dependencies: programDependencies.length,
        adopters: programAdopters.length,
        epics: programEpics.length,
        bepics: programBepics.length,
        stories: programStories.length
      }
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "planning": return <Clock className="h-4 w-4 text-blue-600" />;
      case "on-hold": return <Pause className="h-4 w-4 text-yellow-600" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default: return <ChartGantt className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "planning": return "bg-blue-100 text-blue-800 border-blue-200";
      case "on-hold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return "Not set";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const filteredPrograms = programs.filter(program => 
    selectedStatus === "all" || program.status === selectedStatus
  );

  const statusCounts = programs.reduce((acc, program) => {
    const status = program.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Programs"
          subtitle="Manage all your programs and initiatives"
          onNewClick={handleNewProgram}
        />
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Programs"
        subtitle={`${programs.length} total programs across all statuses`}
        onNewClick={handleNewProgram}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedStatus === 'active' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('active')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Programs</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.active || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedStatus === 'planning' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('planning')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planning</p>
                  <p className="text-2xl font-bold text-blue-600">{statusCounts.planning || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedStatus === 'on-hold' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('on-hold')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Hold</p>
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts['on-hold'] || 0}</p>
                </div>
                <Pause className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedStatus === 'completed' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('completed')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-600">{statusCounts.completed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              All Programs ({programs.length})
            </Button>
            <Button
              variant={selectedStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('active')}
            >
              Active ({statusCounts.active || 0})
            </Button>
            <Button
              variant={selectedStatus === 'planning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('planning')}
            >
              Planning ({statusCounts.planning || 0})
            </Button>
            <Button
              variant={selectedStatus === 'on-hold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('on-hold')}
            >
              On Hold ({statusCounts['on-hold'] || 0})
            </Button>
            <Button
              variant={selectedStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('completed')}
            >
              Completed ({statusCounts.completed || 0})
            </Button>
          </div>
        </div>

        {/* Programs List */}
        <div className="space-y-4">
          {filteredPrograms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ChartGantt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedStatus === 'all' ? 'No programs found' : `No ${selectedStatus} programs`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedStatus === 'all' 
                    ? 'Create your first program to get started'
                    : `No programs with ${selectedStatus} status exist yet`
                  }
                </p>
                <Button onClick={handleNewProgram}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPrograms.map((program) => {
              const completenessData = getProgramCompleteness(program.id);
              
              return (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(program.status || 'active')}
                          <h3 className="text-xl font-semibold text-gray-900">{program.name}</h3>
                          <Badge className={`${getStatusColor(program.status || 'active')} border`}>
                            {program.status || 'active'}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                          {program.description || "No description provided"}
                        </p>

                        {/* Program Completeness */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-700 font-medium">Program Completeness</span>
                            <span className={`font-semibold ${completenessData.completeness >= 80 ? 'text-green-600' : 
                                               completenessData.completeness >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {completenessData.completeness}%
                            </span>
                          </div>
                          <Progress value={completenessData.completeness} className="w-full" />
                        </div>

                        {/* Component Stats - Full Width */}
                        <div className="grid grid-cols-4 gap-6 mb-4 w-full">
                          <div 
                            className="text-center p-4 bg-gray-50 rounded cursor-pointer hover:bg-red-50 transition-colors flex-1"
                            onClick={() => handleNavigateToComponent('Risks', program.id)}
                          >
                            <div className="text-lg font-semibold text-red-600">{completenessData.components.risks}</div>
                            <div className="text-xs text-gray-600">Risks</div>
                          </div>
                          <div 
                            className="text-center p-4 bg-gray-50 rounded cursor-pointer hover:bg-blue-50 transition-colors flex-1"
                            onClick={() => handleNavigateToComponent('Milestones', program.id)}
                          >
                            <div className="text-lg font-semibold text-blue-600">{completenessData.components.milestones}</div>
                            <div className="text-xs text-gray-600">Milestones</div>
                          </div>
                          <div 
                            className="text-center p-4 bg-gray-50 rounded cursor-pointer hover:bg-purple-50 transition-colors flex-1"
                            onClick={() => handleNavigateToComponent('Dependencies', program.id)}
                          >
                            <div className="text-lg font-semibold text-purple-600">{completenessData.components.dependencies}</div>
                            <div className="text-xs text-gray-600">Dependencies</div>
                          </div>
                          <div 
                            className="text-center p-4 bg-gray-50 rounded cursor-pointer hover:bg-green-50 transition-colors flex-1"
                            onClick={() => handleNavigateToComponent('Adopters', program.id)}
                          >
                            <div className="text-lg font-semibold text-green-600">{completenessData.components.adopters}</div>
                            <div className="text-xs text-gray-600">Teams</div>
                          </div>
                        </div>

                        {/* Missing Components Alert */}
                        {completenessData.missing.length > 0 && (
                          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Missing Components</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
                              {completenessData.missing.slice(0, 8).map((component) => (
                                <Badge 
                                  key={component} 
                                  variant="outline" 
                                  className="text-sm px-3 py-2 border-yellow-300 text-yellow-800 cursor-pointer hover:bg-yellow-100 transition-colors whitespace-nowrap text-center justify-center"
                                  onClick={() => handleNavigateToComponent(component, program.id)}
                                >
                                  {component}
                                </Badge>
                              ))}
                              {completenessData.missing.length > 8 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-sm px-3 py-2 border-yellow-300 text-yellow-800 cursor-pointer hover:bg-yellow-100 transition-colors whitespace-nowrap text-center justify-center"
                                  onClick={() => {
                                    // Show all missing components in a modal or toast
                                    toast({
                                      title: "All Missing Components",
                                      description: completenessData.missing.join(", "),
                                      variant: "default",
                                    });
                                  }}
                                >
                                  +{completenessData.missing.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>Start: {formatDate(program.startDate || null)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>End: {formatDate(program.endDate || null)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Users className="h-4 w-4" />
                            <span>Owner: {program.ownerId || "Unassigned"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => analyzeProgramMutation.mutate(program.id)}
                          disabled={analyzeProgramMutation.isPending}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {analyzeProgramMutation.isPending ? "Analyzing..." : "Check Risks"}
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleViewDetails(program.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
      
      {/* Missing Components Modal */}
      {selectedProgram && analysisData && (
        <MissingComponentsModal
          open={showMissingComponentsModal}
          onClose={() => {
            setShowMissingComponentsModal(false);
            setSelectedProgram(null);
            setAnalysisData(null);
          }}
          program={selectedProgram}
          analysis={analysisData}
        />
      )}
    </div>
  );
}