import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartGantt, 
  Plus, 
  Users, 
  Calendar, 
  Target,
  AlertTriangle,
  FileText,
  Settings,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import type { Program, Milestone, Risk, Dependency, Adopter } from "@shared/schema";

export default function ProgramPlanning() {
  const [activeTab, setActiveTab] = useState("overview");
  const [location] = useLocation();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const { toast } = useToast();

  // Extract programId from URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const programId = urlParams.get('programId');

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
  });

  const { data: risks = [] } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  const { data: dependencies = [] } = useQuery<Dependency[]>({
    queryKey: ["/api/dependencies"],
  });

  const { data: adopters = [] } = useQuery<Adopter[]>({
    queryKey: ["/api/adopters"],
  });

  useEffect(() => {
    if (programId && programs.length > 0) {
      const program = programs.find(p => p.id === programId);
      setSelectedProgram(program || null);
    }
  }, [programId, programs]);

  const analyzeProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      return await apiRequest("/api/analyze-program", "POST", { programId });
    },
    onSuccess: (data: any) => {
      const analysis = data.analysis?.[0];
      if (analysis) {
        toast({
          title: "Program Analysis Complete",
          description: `Found ${analysis.riskAlerts?.length || 0} missing components. Completeness: ${analysis.completenessScore}%`,
          variant: analysis.riskAlerts?.length > 0 ? "destructive" : "default",
        });
      }
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze program at this time",
        variant: "destructive"
      });
    }
  });

  const handleNewItem = (type: string) => {
    toast({
      title: `Create New ${type}`,
      description: `This would open a modal to create a new ${type.toLowerCase()}`,
    });
  };

  const programMilestones = milestones.filter(m => m.programId === programId);
  const programRisks = risks.filter(r => r.programId === programId);
  const programDependencies = dependencies.filter(d => d.dependentId === programId);
  const programAdopters = adopters.filter(a => a.programId === programId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "planning": return "bg-blue-100 text-blue-800";
      case "on-hold": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
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

  if (!selectedProgram && programId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Program Details"
          subtitle="Loading program information..."
          showNewButton={false}
        />
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!selectedProgram) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Program & Project Planning"
          subtitle="Create and manage programs with comprehensive tracking"
          showNewButton={false}
        />
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <Card>
            <CardHeader>
              <CardTitle>Select a Program</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Choose a program from the Programs page to view detailed management options.
              </p>
              <Button onClick={() => window.location.href = '/programs'}>
                <ChartGantt className="h-4 w-4 mr-2" />
                Go to Programs
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title={selectedProgram.name}
        subtitle={`Program Details • ${selectedProgram.status} status`}
        showNewButton={false}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Program Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ChartGantt className="h-5 w-5" />
                Program Overview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedProgram.status)}>
                  {selectedProgram.status}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => selectedProgram && analyzeProgramMutation.mutate(selectedProgram.id)}
                  disabled={analyzeProgramMutation.isPending}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {analyzeProgramMutation.isPending ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                <p className="text-gray-900">{selectedProgram.description || "No description provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Timeline</p>
                <p className="text-gray-900">
                  {formatDate(selectedProgram.startDate)} → {formatDate(selectedProgram.endDate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Owner</p>
                <p className="text-gray-900">{selectedProgram.ownerId || "Unassigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="milestones" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Milestones ({programMilestones.length})
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risks ({programRisks.length})
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Dependencies ({programDependencies.length})
            </TabsTrigger>
            <TabsTrigger value="adopters" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Adopters ({programAdopters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="milestones">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Program Milestones</CardTitle>
                  <Button onClick={() => handleNewItem("Milestone")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {programMilestones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No milestones defined</p>
                    <p className="text-sm">Add milestones to track program progress</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {programMilestones.map((milestone) => (
                      <div key={milestone.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm text-gray-600">{milestone.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {formatDate(milestone.dueDate)}
                            </p>
                          </div>
                          <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
                            {milestone.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Program Risks</CardTitle>
                  <Button onClick={() => handleNewItem("Risk")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Risk
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {programRisks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No risks identified</p>
                    <p className="text-sm">Add risks to manage program threats</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {programRisks.map((risk) => (
                      <div key={risk.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{risk.title}</h4>
                            <p className="text-sm text-gray-600">{risk.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Impact: {risk.impact} • Probability: {risk.probability}
                            </p>
                          </div>
                          <Badge variant={risk.status === 'open' ? 'destructive' : 'default'}>
                            {risk.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependencies">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Program Dependencies</CardTitle>
                  <Button onClick={() => handleNewItem("Dependency")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Dependency
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {programDependencies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ArrowRight className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No dependencies tracked</p>
                    <p className="text-sm">Add dependencies to manage coordination</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {programDependencies.map((dependency) => (
                      <div key={dependency.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{dependency.title}</h4>
                            <p className="text-sm text-gray-600">{dependency.description}</p>
                          </div>
                          <Badge variant={dependency.status === 'blocked' ? 'destructive' : 'default'}>
                            {dependency.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adopters">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Adopter Teams</CardTitle>
                  <Button onClick={() => handleNewItem("Adopter")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {programAdopters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No adopter teams defined</p>
                    <p className="text-sm">Add teams to track adoption readiness</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {programAdopters.map((adopter) => (
                      <div key={adopter.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{adopter.teamName}</h4>
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Readiness Score</span>
                                <span>{adopter.readinessScore}%</span>
                              </div>
                              <Progress value={adopter.readinessScore} className="h-2" />
                            </div>
                          </div>
                          <Badge variant={adopter.readinessScore >= 80 ? 'default' : 'outline'}>
                            {adopter.readinessScore >= 80 ? 'Ready' : 'In Progress'}
                          </Badge>
                        </div>
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
