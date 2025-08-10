import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  FileText,
  Brain,
  Users,
  Target,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProgramPhase, PhaseStage, Program } from "@shared/schema";

interface ProgramPhaseManagerProps {
  program: Program;
}

// Define the 5 phases with their internal stages
const PROJECT_PHASES = {
  initiation: {
    name: "Initiation",
    icon: <Target size={20} />,
    stages: [
      { name: "Project Charter Development", description: "Define project purpose, objectives, and high-level scope" },
      { name: "Stakeholder Identification", description: "Identify all project stakeholders and their interests" },
      { name: "Initial Risk Assessment", description: "Conduct high-level risk identification and assessment" },
      { name: "Business Case Validation", description: "Validate business justification and expected benefits" },
      { name: "Project Manager Assignment", description: "Assign project manager and define authority levels" }
    ]
  },
  planning: {
    name: "Planning", 
    icon: <FileText size={20} />,
    stages: [
      { name: "Scope Definition", description: "Define detailed project scope and deliverables" },
      { name: "Work Breakdown Structure", description: "Break down project work into manageable components" },
      { name: "Schedule Development", description: "Sequence activities and develop project timeline" },
      { name: "Resource Planning", description: "Identify and plan for required resources" },
      { name: "Risk Management Planning", description: "Develop comprehensive risk management approach" },
      { name: "Communication Planning", description: "Define communication requirements and methods" },
      { name: "Quality Planning", description: "Establish quality standards and metrics" },
      { name: "Procurement Planning", description: "Plan for external purchases and contracts" }
    ]
  },
  execution: {
    name: "Execution",
    icon: <Play size={20} />,
    stages: [
      { name: "Team Development", description: "Build and develop the project team" },
      { name: "Work Performance", description: "Execute the work defined in project plan" },
      { name: "Quality Assurance", description: "Implement quality assurance processes" },
      { name: "Stakeholder Engagement", description: "Manage stakeholder expectations and engagement" },
      { name: "Communication Management", description: "Execute communication plan and manage information" },
      { name: "Procurement Management", description: "Manage supplier relationships and contracts" }
    ]
  },
  monitoring_controlling: {
    name: "Monitoring & Controlling",
    icon: <Clock size={20} />,
    stages: [
      { name: "Performance Monitoring", description: "Monitor project performance against baselines" },
      { name: "Change Control", description: "Review and approve/reject change requests" },
      { name: "Risk Monitoring", description: "Track identified risks and identify new risks" },
      { name: "Schedule Control", description: "Control changes to project schedule" },
      { name: "Cost Control", description: "Monitor project costs and budget performance" },
      { name: "Quality Control", description: "Monitor deliverables to ensure quality standards" },
      { name: "Stakeholder Engagement Control", description: "Monitor stakeholder relationships and engagement" }
    ]
  },
  closure: {
    name: "Closure",
    icon: <CheckCircle size={20} />,
    stages: [
      { name: "Final Deliverables", description: "Complete and transfer final project deliverables" },
      { name: "Contract Closure", description: "Close out all project contracts and procurements" },
      { name: "Administrative Closure", description: "Complete administrative activities and documentation" },
      { name: "Lessons Learned", description: "Capture and document lessons learned" },
      { name: "Resource Release", description: "Release project resources and team members" },
      { name: "Project Archive", description: "Archive all project documents and artifacts" }
    ]
  }
};

export function ProgramPhaseManager({ program }: ProgramPhaseManagerProps) {
  const [currentPhase, setCurrentPhase] = useState<string>("initiation");
  const [stageInputs, setStageInputs] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: programPhases = [] } = useQuery<ProgramPhase[]>({
    queryKey: ["/api/program-phases", program.id],
  });

  const { data: phaseStages = [] } = useQuery<PhaseStage[]>({
    queryKey: ["/api/phase-stages", program.id],
  });

  const updatePhaseMutation = useMutation({
    mutationFn: (data: { phaseId: string; updates: any }) =>
      apiRequest(`/api/program-phases/${data.phaseId}`, {
        method: "PATCH",
        body: JSON.stringify(data.updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program-phases"] });
      toast({ title: "Phase updated successfully" });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: (data: { stageId: string; updates: any }) =>
      apiRequest(`/api/phase-stages/${data.stageId}`, {
        method: "PATCH", 
        body: JSON.stringify(data.updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phase-stages"] });
      toast({ title: "Stage updated successfully" });
    },
  });

  const getPhaseStatus = (phaseName: string) => {
    const phase = programPhases.find(p => p.phase === phaseName);
    return phase?.status || "not_started";
  };

  const getPhaseProgress = (phaseName: string) => {
    const phase = programPhases.find(p => p.phase === phaseName);
    if (!phase) return 0;
    
    const stages = phaseStages.filter(s => s.programPhaseId === phase.id);
    if (stages.length === 0) return 0;
    
    const completedStages = stages.filter(s => s.status === "completed");
    return Math.round((completedStages.length / stages.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800"; 
      case "not_started": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle size={16} className="text-green-600" />;
      case "in_progress": return <Clock size={16} className="text-blue-600" />;
      case "not_started": return <Pause size={16} className="text-gray-600" />;
      default: return <Pause size={16} className="text-gray-600" />;
    }
  };

  const canStartPhase = (phaseName: string) => {
    const phaseKeys = Object.keys(PROJECT_PHASES);
    const currentIndex = phaseKeys.indexOf(phaseName);
    
    if (currentIndex === 0) return true; // First phase can always start
    
    const previousPhase = phaseKeys[currentIndex - 1];
    const previousPhaseStatus = getPhaseStatus(previousPhase);
    return previousPhaseStatus === "completed";
  };

  const handleStartPhase = async (phaseName: string) => {
    if (!canStartPhase(phaseName)) {
      toast({
        title: "Cannot start phase",
        description: "Previous phase must be completed first",
        variant: "destructive",
      });
      return;
    }

    // Create or update phase
    const existingPhase = programPhases.find(p => p.phase === phaseName);
    if (existingPhase) {
      await updatePhaseMutation.mutateAsync({
        phaseId: existingPhase.id,
        updates: { status: "in_progress", startDate: new Date() }
      });
    }
    
    setCurrentPhase(phaseName);
  };

  const handleCompleteStage = async (stage: PhaseStage) => {
    await updateStageMutation.mutateAsync({
      stageId: stage.id,
      updates: { 
        status: "completed", 
        completedDate: new Date(),
        userInputs: stageInputs[stage.id] || {}
      }
    });
  };

  const renderPhaseOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {Object.entries(PROJECT_PHASES).map(([key, phase]) => {
        const status = getPhaseStatus(key);
        const progress = getPhaseProgress(key);
        const canStart = canStartPhase(key);
        
        return (
          <Card key={key} className={`cursor-pointer transition-all ${
            currentPhase === key ? "ring-2 ring-primary-500" : ""
          }`} onClick={() => setCurrentPhase(key)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                {phase.icon}
                {getStatusIcon(status)}
              </div>
              <h3 className="font-semibold text-sm mb-2">{phase.name}</h3>
              <Badge className={`${getStatusColor(status)} text-xs mb-2`}>
                {status.replace("_", " ")}
              </Badge>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
              {status === "not_started" && (
                <Button 
                  size="sm" 
                  className="w-full mt-2" 
                  disabled={!canStart}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartPhase(key);
                  }}
                >
                  {canStart ? "Start Phase" : "Locked"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderPhaseDetails = () => {
    const phase = PROJECT_PHASES[currentPhase as keyof typeof PROJECT_PHASES];
    const programPhase = programPhases.find(p => p.phase === currentPhase);
    const stages = phaseStages.filter(s => s.programPhaseId === programPhase?.id);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {phase.icon}
            <h2 className="text-2xl font-bold">{phase.name}</h2>
            <Badge className={getStatusColor(getPhaseStatus(currentPhase))}>
              {getPhaseStatus(currentPhase).replace("_", " ")}
            </Badge>
          </div>
          {getPhaseStatus(currentPhase) === "in_progress" && (
            <Button>Complete Phase</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-blue-600" />
                <span className="font-medium">Phase Progress</span>
              </div>
              <Progress value={getPhaseProgress(currentPhase)} className="mb-2" />
              <p className="text-sm text-gray-600">{getPhaseProgress(currentPhase)}% complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-green-600" />
                <span className="font-medium">Stages Complete</span>
              </div>
              <p className="text-2xl font-bold">
                {stages.filter(s => s.status === "completed").length} / {phase.stages.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-orange-600" />
                <span className="font-medium">Duration</span>
              </div>
              <p className="text-sm text-gray-600">
                {programPhase?.startDate 
                  ? `Started ${new Date(programPhase.startDate).toLocaleDateString()}`
                  : "Not started"
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Phase Stages */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Phase Stages</h3>
          {phase.stages.map((stageTemplate, index) => {
            const stage = stages.find(s => s.stageName === stageTemplate.name);
            const isCompleted = stage?.status === "completed";
            const isInProgress = stage?.status === "in_progress";
            const canStart = index === 0 || stages.find(s => s.stageOrder === index)?.status === "completed";
            
            return (
              <Card key={stageTemplate.name} className={`${
                isCompleted ? "bg-green-50 border-green-200" : 
                isInProgress ? "bg-blue-50 border-blue-200" : ""
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(stage?.status || "not_started")}
                        <h4 className="font-medium">{stageTemplate.name}</h4>
                        <Badge className={getStatusColor(stage?.status || "not_started")}>
                          {stage?.status?.replace("_", " ") || "Not Started"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{stageTemplate.description}</p>
                      
                      {isInProgress && (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Brain size={16} className="text-purple-600 mt-1" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-purple-800 mb-1">AI Recommendations:</p>
                              <div className="bg-purple-50 p-3 rounded text-sm">
                                <p>• Consider using standardized templates for consistency</p>
                                <p>• Engage key stakeholders early in the process</p>
                                <p>• Document all decisions and rationale</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Stage Inputs:</Label>
                            <Textarea 
                              placeholder="Enter your work, findings, and outputs for this stage..."
                              value={stageInputs[stage?.id || ""] || ""}
                              onChange={(e) => setStageInputs(prev => ({
                                ...prev,
                                [stage?.id || ""]: e.target.value
                              }))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      {!isCompleted && canStart && (
                        <Button
                          size="sm"
                          onClick={() => stage && handleCompleteStage(stage)}
                          disabled={!stageInputs[stage?.id || ""]}
                        >
                          Complete Stage
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {!canStart && !isCompleted && (
                    <Alert>
                      <AlertTriangle size={16} />
                      <AlertDescription>
                        Complete the previous stage before starting this one.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Program Phase Management</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{program.name}</Badge>
          <Badge className={getStatusColor(program.status || "planning")}>
            {program.status?.replace("_", " ") || "Planning"}
          </Badge>
        </div>
      </div>

      <Tabs value="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Phase Overview</TabsTrigger>
          <TabsTrigger value="details">Phase Details</TabsTrigger>
          <TabsTrigger value="templates">Templates & Best Practices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderPhaseOverview()}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {renderPhaseDetails()}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phase Templates & Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Available Templates</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText size={16} className="mr-2" />
                      Project Charter Template
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText size={16} className="mr-2" />
                      Stakeholder Analysis Template
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText size={16} className="mr-2" />
                      Risk Register Template
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Best Practices</h4>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="font-medium text-blue-800">Early Stakeholder Engagement</p>
                      <p className="text-blue-700">Identify and engage stakeholders from the very beginning</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="font-medium text-green-800">Comprehensive Documentation</p>
                      <p className="text-green-700">Document all decisions, assumptions, and constraints</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <p className="font-medium text-purple-800">Iterative Planning</p>
                      <p className="text-purple-700">Plan progressively as more information becomes available</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}