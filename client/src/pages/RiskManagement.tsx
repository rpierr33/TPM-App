import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  TrendingUp,
  Shield,
  Clock,
  Plus,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Database,
  Target,
  Users,
  Calendar,
  Pencil,
  Check,
  X
} from "lucide-react";
import type { Risk, Program } from "@shared/schema";

export default function RiskManagement() {
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSeverity, setEditSeverity] = useState("");
  const [newRisk, setNewRisk] = useState({
    title: "",
    description: "",
    programId: "",
    severity: "medium" as const,
    impact: 3,
    probability: 3,
    status: "identified" as const,
    pmpCategory: "scope" as const,
    mitigationPlan: ""
  });

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: risks = [], isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  // Auto-detect gaps on component mount
  useEffect(() => {
    const detectGaps = async () => {
      try {
        await apiRequest('/api/programs/detect-all-gaps', 'POST');
        console.log('Comprehensive gap detection completed');
        queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      } catch (error) {
        console.error('Failed to run gap detection:', error);
      }
    };
    
    detectGaps();
  }, []);

  const addRiskMutation = useMutation({
    mutationFn: async (riskData: any) => {
      await apiRequest('/api/risks', 'POST', riskData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Risk created successfully",
      });
      setShowAddRiskModal(false);
      setNewRisk({
        title: "",
        description: "",
        programId: "",
        severity: "medium",
        impact: 3,
        probability: 3,
        status: "identified",
        pmpCategory: "scope",
        mitigationPlan: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create risk",
        variant: "destructive",
      });
    },
  });

  const detectGapsMutation = useMutation({
    mutationFn: async (programId: string) => {
      await apiRequest(`/api/programs/${programId}/detect-gaps`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Gap detection completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to detect gaps",
        variant: "destructive",
      });
    },
  });

  const importJiraRisksMutation = useMutation({
    mutationFn: async (programId: string) => {
      await apiRequest(`/api/programs/${programId}/import-jira-risks`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "JIRA risks imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Info",
        description: "JIRA integration ready for Live mode",
        variant: "default",
      });
    },
  });

  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      await apiRequest(`/api/risks/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Risk updated successfully",
      });
      setEditingRiskId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update risk",
        variant: "destructive",
      });
    },
  });

  const startEditing = (risk: Risk) => {
    setEditingRiskId(risk.id);
    setEditTitle(risk.title || "");
    setEditSeverity(risk.severity || "medium");
  };

  const cancelEditing = () => {
    setEditingRiskId(null);
    setEditTitle("");
    setEditSeverity("");
  };

  const saveEditing = (riskId: string) => {
    updateRiskMutation.mutate({
      id: riskId,
      data: { title: editTitle, severity: editSeverity },
    });
  };

  const navigateToProgram = (programId: string | null) => {
    if (programId) {
      setLocation(`/programs/${programId}`);
    }
  };

  // Filter risks based on selected filters
  const filteredRisks = risks.filter(risk => {
    if (selectedProgram !== "all" && risk.programId !== selectedProgram) return false;
    if (severityFilter !== "all" && risk.severity !== severityFilter) return false;
    if (statusFilter !== "all" && risk.status !== statusFilter) return false;
    return true;
  });

  // Program-filtered risks (for analytics cards — not affected by severity/status filter)
  const programFilteredRisks = risks.filter(risk => {
    if (selectedProgram !== "all" && risk.programId !== selectedProgram) return false;
    return true;
  });

  // Risk analytics (based on program filter only, so card counts stay visible)
  const riskAnalytics = {
    total: programFilteredRisks.length,
    critical: programFilteredRisks.filter(r => r.severity === 'critical').length,
    high: programFilteredRisks.filter(r => r.severity === 'high').length,
    medium: programFilteredRisks.filter(r => r.severity === 'medium').length,
    low: programFilteredRisks.filter(r => r.severity === 'low').length,
    identified: programFilteredRisks.filter(r => r.status === 'identified').length,
    inProgress: programFilteredRisks.filter(r => r.status === 'in_progress').length,
    mitigated: programFilteredRisks.filter(r => r.status === 'mitigated').length
  };

  const getSeverityBadge = (severity: string | null) => {
    const variants: { [key: string]: string } = {
      critical: "bg-red-600 text-white",
      high: "bg-orange-500 text-white", 
      medium: "bg-yellow-500 text-black",
      low: "bg-green-500 text-white"
    };
    return (severity ? variants[severity] : null) || variants.medium;
  };

  const getStatusBadge = (status: string | null) => {
    const variants: { [key: string]: string } = {
      identified: "bg-blue-500 text-white",
      in_progress: "bg-purple-500 text-white",
      mitigated: "bg-green-600 text-white",
      resolved: "bg-gray-500 text-white"
    };
    return (status ? variants[status] : null) || variants.identified;
  };

  const handleAddRisk = () => {
    if (!newRisk.title.trim() || !newRisk.description.trim() || !newRisk.programId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addRiskMutation.mutate(newRisk);
  };

  const handleDetectGaps = (programId: string) => {
    detectGapsMutation.mutate(programId);
  };

  const handleImportJiraRisks = (programId: string) => {
    importJiraRisksMutation.mutate(programId);
  };

  const getProgramName = (programId: string | null) => {
    const program = programs.find(p => p.id === programId);
    return program?.name || "Unknown Program";
  };

  if (programsLoading || risksLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Risk Management" subtitle="Identify and mitigate program risks" showNewButton={false} />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading risks...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title="Risk Management"
        subtitle="Identify and mitigate program risks"
        onNewClick={() => setShowAddRiskModal(true)}
        newButtonText="Add Risk"
      />

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">

        {/* Risk Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
          <Card
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 hover:shadow-md ${severityFilter === "all" && statusFilter === "all" ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" : ""}`}
            onClick={() => { setSeverityFilter("all"); setStatusFilter("all"); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Risks</p>
                  <p className="text-2xl font-bold">{riskAnalytics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-red-400 hover:shadow-md ${severityFilter === "critical" ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-950" : ""}`}
            onClick={() => { setSeverityFilter(severityFilter === "critical" ? "all" : "critical"); setStatusFilter("all"); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{riskAnalytics.critical}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-orange-400 hover:shadow-md ${severityFilter === "high" ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950" : ""}`}
            onClick={() => { setSeverityFilter(severityFilter === "high" ? "all" : "high"); setStatusFilter("all"); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High</p>
                  <p className="text-2xl font-bold text-orange-600">{riskAnalytics.high}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-yellow-400 hover:shadow-md ${severityFilter === "medium" ? "ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-950" : ""}`}
            onClick={() => { setSeverityFilter(severityFilter === "medium" ? "all" : "medium"); setStatusFilter("all"); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Medium</p>
                  <p className="text-2xl font-bold text-yellow-600">{riskAnalytics.medium}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-green-400 hover:shadow-md ${severityFilter === "low" ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950" : ""}`}
            onClick={() => { setSeverityFilter(severityFilter === "low" ? "all" : "low"); setStatusFilter("all"); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Low</p>
                  <p className="text-2xl font-bold text-green-600">{riskAnalytics.low}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 hover:shadow-md ${statusFilter === "identified" ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" : ""}`}
            onClick={() => { setStatusFilter(statusFilter === "identified" ? "all" : "identified"); setSeverityFilter("all"); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Identified</p>
                  <p className="text-2xl font-bold text-blue-600">{riskAnalytics.identified}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-purple-400 hover:shadow-md ${statusFilter === "in_progress" ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950" : ""}`}
            onClick={() => { setStatusFilter(statusFilter === "in_progress" ? "all" : "in_progress"); setSeverityFilter("all"); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-purple-600">{riskAnalytics.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-green-400 hover:shadow-md ${statusFilter === "mitigated" ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950" : ""}`}
            onClick={() => { setStatusFilter(statusFilter === "mitigated" ? "all" : "mitigated"); setSeverityFilter("all"); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mitigated</p>
                  <p className="text-2xl font-bold text-green-600">{riskAnalytics.mitigated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters & Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="programSelect">Program</Label>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severityFilter">Severity</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="statusFilter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedProgram !== "all" && (
                <>
                  <Button 
                    onClick={() => handleDetectGaps(selectedProgram)}
                    disabled={detectGapsMutation.isPending}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Detect Gaps
                  </Button>
                  <Button 
                    onClick={() => handleImportJiraRisks(selectedProgram)}
                    disabled={importJiraRisksMutation.isPending}
                    variant="outline"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Import JIRA Risks
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk List */}
        <div className="grid gap-4">
          {filteredRisks.map((risk) => (
            <Card key={risk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {editingRiskId === risk.id ? (
                      <div className="space-y-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-lg font-semibold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">Severity:</Label>
                          <Select value={editSeverity} onValueChange={setEditSeverity}>
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={() => saveEditing(risk.id)} disabled={updateRiskMutation.isPending}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing}>
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              setSelectedRisk(risk);
                              setShowDetailsModal(true);
                            }}
                          >
                            {risk.title}
                          </h3>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditing(risk)}>
                            <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                          </Button>
                        </div>
                      </>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{risk.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getSeverityBadge(editingRiskId === risk.id ? editSeverity : risk.severity)}>
                        {(editingRiskId === risk.id ? editSeverity : risk.severity)?.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusBadge(risk.status)}>
                        {risk.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {risk.pmpCategory && (
                        <Badge variant="outline">
                          {risk.pmpCategory}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Program:{" "}
                      <button
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        onClick={() => navigateToProgram(risk.programId)}
                      >
                        {getProgramName(risk.programId)}
                      </button>
                      {" "}|{" "}
                      Impact: {risk.impact}/5 |
                      Probability: {risk.probability}/5
                      {risk.createdAt && (
                        <> | Created: {new Date(risk.createdAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRisk(risk);
                      setShowDetailsModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredRisks.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Risks Found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No risks match your current filters. Try adjusting the filters or add a new risk.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Risk Modal */}
      <Dialog open={showAddRiskModal} onOpenChange={setShowAddRiskModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Risk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Risk Title *</Label>
              <Input
                id="title"
                value={newRisk.title}
                onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                placeholder="Enter risk title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newRisk.description}
                onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                placeholder="Describe the risk and its potential impact"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="program">Program *</Label>
                <Select value={newRisk.programId} onValueChange={(value) => setNewRisk({ ...newRisk, programId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={newRisk.severity} onValueChange={(value: any) => setNewRisk({ ...newRisk, severity: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="impact">Impact (1-5)</Label>
                <Input
                  id="impact"
                  type="number"
                  min="1"
                  max="5"
                  value={newRisk.impact}
                  onChange={(e) => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) || 3 })}
                />
              </div>

              <div>
                <Label htmlFor="probability">Probability (1-5)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="1"
                  max="5"
                  value={newRisk.probability}
                  onChange={(e) => setNewRisk({ ...newRisk, probability: parseInt(e.target.value) || 3 })}
                />
              </div>

              <div>
                <Label htmlFor="category">PMP Category</Label>
                <Select value={newRisk.pmpCategory} onValueChange={(value: any) => setNewRisk({ ...newRisk, pmpCategory: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scope">Scope</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="cost">Cost</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="resources">Resources</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="mitigation">Mitigation Plan</Label>
              <Textarea
                id="mitigation"
                value={newRisk.mitigationPlan}
                onChange={(e) => setNewRisk({ ...newRisk, mitigationPlan: e.target.value })}
                placeholder="Describe how this risk will be mitigated"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddRiskModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRisk} disabled={addRiskMutation.isPending}>
                {addRiskMutation.isPending ? "Creating..." : "Create Risk"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Risk Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Risk Details</DialogTitle>
          </DialogHeader>
          {selectedRisk && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedRisk.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedRisk.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Program</Label>
                  <button
                    className="block font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={() => navigateToProgram(selectedRisk.programId)}
                  >
                    {getProgramName(selectedRisk.programId)}
                  </button>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusBadge(selectedRisk.status)}>
                    {selectedRisk.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Severity</Label>
                  <Badge className={getSeverityBadge(selectedRisk.severity)}>
                    {selectedRisk.severity?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Impact</Label>
                  <p className="font-medium">{selectedRisk.impact}/5</p>
                </div>
                <div>
                  <Label>Probability</Label>
                  <p className="font-medium">{selectedRisk.probability}/5</p>
                </div>
              </div>

              {selectedRisk.pmpCategory && (
                <div>
                  <Label>PMP Category</Label>
                  <p className="font-medium capitalize">{selectedRisk.pmpCategory}</p>
                </div>
              )}

              {selectedRisk.mitigationPlan && (
                <div>
                  <Label>Mitigation Plan</Label>
                  <p className="text-gray-600 dark:text-gray-400">{selectedRisk.mitigationPlan}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                {selectedRisk.createdAt && (
                  <div>
                    <Label>Created</Label>
                    <p>{new Date(selectedRisk.createdAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedRisk.updatedAt && (
                  <div>
                    <Label>Updated</Label>
                    <p>{new Date(selectedRisk.updatedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}