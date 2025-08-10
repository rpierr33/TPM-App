import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Plus, Filter, ExternalLink, Brain, TrendingUp, Eye, Flag, Users, GitBranch } from "lucide-react";
import { ComponentContextCard } from "@/components/layout/ComponentContextCard";
import { ComponentAnalytics } from "@/components/layout/ComponentAnalytics";
import { useLocation } from "wouter";
import { useMode } from "@/hooks/useMode";
import type { Risk, Program } from "@shared/schema";

export default function RiskManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    programId: "",
    severity: "medium",
    impact: 3,
    probability: 3,
    status: "identified",
    ownerId: "",
    mitigationPlan: "",
    dueDate: "",
    pushToJira: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isTestMode } = useMode();
  const [, setLocation] = useLocation();

  const { data: risks = [], isLoading } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const createRiskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/risks", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Risk created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create risk",
        variant: "destructive",
      });
    },
  });

  const fetchContextMutation = useMutation({
    mutationFn: async (riskId: string) => {
      return await apiRequest(`/api/risks/${riskId}/context`, "GET");
    },
    onSuccess: (data: any) => {
      setContextData(data);
      setShowContextModal(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to load risk context",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      programId: "",
      severity: "medium",
      impact: 3,
      probability: 3,
      status: "identified",
      ownerId: "",
      mitigationPlan: "",
      dueDate: "",
      pushToJira: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRiskMutation.mutate(formData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved": return "bg-green-100 text-green-800";
      case "mitigated": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "identified": return "bg-blue-100 text-blue-800";
      case "accepted": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRisks = risks.filter((risk: any) => {
    const severityMatch = filterSeverity === "all" || risk.severity === filterSeverity;
    const statusMatch = filterStatus === "all" || risk.status === filterStatus;
    return severityMatch && statusMatch;
  });

  const handleNewRisk = () => {
    setShowCreateModal(true);
  };

  const handleViewRiskContext = (risk: Risk) => {
    setSelectedRisk(risk);
    fetchContextMutation.mutate(risk.id);
  };

  const handleViewComponent = (type: string, programId?: string) => {
    switch (type) {
      case 'milestones':
        setLocation(`/milestones${programId ? `?programId=${programId}` : ''}`);
        break;
      case 'dependencies':
        setLocation(`/dependencies${programId ? `?programId=${programId}` : ''}`);
        break;
      case 'adopters':
        setLocation(`/adopter-support${programId ? `?programId=${programId}` : ''}`);
        break;
      case 'programs':
        setLocation(`/programs`);
        break;
      case 'projects':
        setLocation(`/program-planning${programId ? `?programId=${programId}` : ''}`);
        break;
    }
  };

  const calculateRiskScore = (impact: number, probability: number) => {
    return Math.round((impact * probability) * 10);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Risk Management"
        subtitle="Comprehensive risk tracking with AI-powered insights and JIRA integration"
        onNewClick={handleNewRisk}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <Tabs defaultValue="risks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="risks">Risk Registry</TabsTrigger>
            <TabsTrigger value="heatmap">Risk Heatmap</TabsTrigger>
            <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="risks" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <Label className="text-sm font-medium">Severity:</Label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Risks Table */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Risk Registry</CardTitle>
                  <div className="flex gap-2">
                    {!isTestMode && (
                      <Button variant="outline" size="sm">
                        <ExternalLink size={14} className="mr-1" />
                        Sync with JIRA
                      </Button>
                    )}
                    <Button size="sm" onClick={handleNewRisk} className="bg-primary-500 text-white hover:bg-primary-600">
                      <Plus size={14} className="mr-1" />
                      Add Risk
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <div className="animate-pulse space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : filteredRisks.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No risks found</h3>
                    <div className="text-gray-500 mb-4">
                      {filterSeverity === "all" && filterStatus === "all"
                        ? programs.length > 0 
                          ? (
                            <div>
                              <p className="mb-3">The following programs are missing risk assessments:</p>
                              <ul className="space-y-2 mb-4">
                                {programs.map(program => (
                                  <li key={program.id} className="flex items-center gap-2 text-sm bg-red-50 px-3 py-2 rounded border-l-4 border-red-400">
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span className="font-medium">Program "</span>
                                    <button 
                                      className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                      onClick={() => setLocation(`/program-planning?id=${program.id}`)}
                                    >
                                      {program.name}
                                    </button>
                                    <span className="font-medium">"</span>
                                    <span className="text-gray-600">has no risks identified</span>
                                  </li>
                                ))}
                              </ul>
                              <p>Get started by identifying and documenting risks to prevent issues.</p>
                            </div>
                          )
                          : <p>Start by identifying and documenting program risks.</p>
                        : <p>No risks match the selected filters.</p>
                      }
                    </div>
                    <Button onClick={handleNewRisk} className="bg-primary-500 text-white hover:bg-primary-600">
                      <Plus size={16} className="mr-2" />
                      Create Risk
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Risk
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Severity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Impact/Probability
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            AI Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRisks.map((risk: any) => (
                          <tr key={risk.id}>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {risk.description}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`${getSeverityColor(risk.severity)} font-semibold capitalize`}>
                                {risk.severity || "medium"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {risk.impact || 3} / {risk.probability || 3}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Brain size={14} className="text-purple-500" />
                                <span className="text-sm font-medium">
                                  {risk.aiScore || calculateRiskScore(risk.impact || 3, risk.probability || 3)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {risk.owner?.name || "Unassigned"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`${getStatusColor(risk.status)} font-semibold capitalize`}>
                                {risk.status?.replace("_", " ") || "identified"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleViewRiskContext(risk)} className="text-blue-600 hover:text-blue-800">
                                  <Eye size={14} className="mr-1" />
                                  View Context
                                </Button>
                                {risk.jiraIssueKey && (
                                  <Button variant="ghost" size="sm" className="text-primary-500">
                                    <ExternalLink size={14} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskHeatmap />
              
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Critical:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div className="w-1/4 h-2 bg-danger rounded"></div>
                        </div>
                        <span className="font-medium">
                          {risks.filter((r: any) => r.severity === "critical").length}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">High:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div className="w-1/3 h-2 bg-danger rounded"></div>
                        </div>
                        <span className="font-medium">
                          {risks.filter((r: any) => r.severity === "high").length}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Medium:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div className="w-2/3 h-2 bg-warning rounded"></div>
                        </div>
                        <span className="font-medium">
                          {risks.filter((r: any) => r.severity === "medium").length}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Low:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div className="w-1/2 h-2 bg-success rounded"></div>
                        </div>
                        <span className="font-medium">
                          {risks.filter((r: any) => r.severity === "low").length}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="text-purple-500" size={20} />
                  AI Risk Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Risk Predictions</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="text-red-500" size={16} />
                          <span className="font-medium text-red-700">High Risk Alert</span>
                        </div>
                        <p className="text-sm text-red-600">
                          API dependency risk likely to escalate within 2 weeks based on velocity trends.
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="text-yellow-500" size={16} />
                          <span className="font-medium text-yellow-700">Medium Risk Alert</span>
                        </div>
                        <p className="text-sm text-yellow-600">
                          Resource allocation risks detected in mobile team dependencies.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Recommended Actions</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700 font-medium mb-1">
                          Schedule risk review meeting
                        </p>
                        <p className="text-sm text-blue-600">
                          Critical risks require immediate stakeholder attention.
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700 font-medium mb-1">
                          Update mitigation plans
                        </p>
                        <p className="text-sm text-green-600">
                          3 risks have outdated mitigation strategies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Risk Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Risk</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Risk Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Describe the risk clearly and concisely"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Risk Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed description of the risk, its causes, and potential consequences"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="impact">Impact (1-5)</Label>
                <Select value={formData.impact.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, impact: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Minimal</SelectItem>
                    <SelectItem value="2">2 - Minor</SelectItem>
                    <SelectItem value="3">3 - Moderate</SelectItem>
                    <SelectItem value="4">4 - Major</SelectItem>
                    <SelectItem value="5">5 - Catastrophic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="probability">Probability (1-5)</Label>
                <Select value={formData.probability.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, probability: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Low</SelectItem>
                    <SelectItem value="2">2 - Low</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - High</SelectItem>
                    <SelectItem value="5">5 - Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="mitigationPlan">Mitigation Plan</Label>
              <Textarea
                id="mitigationPlan"
                value={formData.mitigationPlan}
                onChange={(e) => setFormData(prev => ({ ...prev, mitigationPlan: e.target.value }))}
                placeholder="Describe the plan to mitigate or address this risk"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="program">Program</Label>
                <Select value={formData.programId} onValueChange={(value) => setFormData(prev => ({ ...prev, programId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program: any) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            {!isTestMode && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pushToJira"
                  checked={formData.pushToJira}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pushToJira: !!checked }))}
                />
                <Label htmlFor="pushToJira" className="text-sm">
                  Push to JIRA (configurable issue type)
                </Label>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary-500 text-white hover:bg-primary-600"
                disabled={createRiskMutation.isPending}
              >
                {createRiskMutation.isPending ? "Creating..." : "Create Risk"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Risk Context Modal */}
      <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              Risk Context: {selectedRisk?.title}
            </DialogTitle>
          </DialogHeader>

          {contextData && (
            <div className="space-y-6">
              <ComponentContextCard 
                title="Related Milestones"
                items={contextData.relatedComponents.milestones || []}
                type="milestones"
                onViewAll={() => handleViewComponent('milestones', contextData.program?.id)}
              />
              
              <ComponentContextCard 
                title="Related Dependencies"
                items={contextData.relatedComponents.dependencies || []}
                type="dependencies"
                onViewAll={() => handleViewComponent('dependencies', contextData.program?.id)}
              />
              
              <ComponentContextCard 
                title="Related Adopters"
                items={contextData.relatedComponents.adopters || []}
                type="adopters"
                onViewAll={() => handleViewComponent('adopters', contextData.program?.id)}
              />
            </div>
          )}

          {fetchContextMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
