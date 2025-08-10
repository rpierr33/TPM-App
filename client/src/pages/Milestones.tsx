import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentContextCard } from "@/components/layout/ComponentContextCard";
import { ComponentAnalytics } from "@/components/layout/ComponentAnalytics";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Flag, Calendar, User, ExternalLink, Plus, Filter, AlertTriangle, Users, GitBranch, BarChart3, Eye } from "lucide-react";
import { useMode } from "@/hooks/useMode";
import type { Milestone, Program, MilestoneStep, JiraBepic, JiraEpic, JiraStory } from "@shared/schema";
import { MilestoneHierarchy } from "@/components/milestones/MilestoneHierarchy";

export default function Milestones() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    programId: "",
    status: "not_started",
    ownerId: "",
    dueDate: "",
    pushToJira: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isTestMode } = useMode();
  const [, setLocation] = useLocation();

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: milestoneSteps = [] } = useQuery<MilestoneStep[]>({
    queryKey: ["/api/milestone-steps"],
  });

  const { data: jiraBepics = [] } = useQuery<JiraBepic[]>({
    queryKey: ["/api/jira-bepics"],
  });

  const { data: jiraEpics = [] } = useQuery<JiraEpic[]>({
    queryKey: ["/api/jira-epics"],
  });

  const { data: jiraStories = [] } = useQuery<JiraStory[]>({
    queryKey: ["/api/jira-stories"],
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/milestones", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Milestone created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive",
      });
    },
  });

  const fetchContextMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return await apiRequest(`/api/milestones/${milestoneId}/context`, "GET");
    },
    onSuccess: (data: any) => {
      setContextData(data);
      setShowContextModal(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to load milestone context",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      programId: "",
      status: "not_started",
      ownerId: "",
      dueDate: "",
      pushToJira: false,
    });
  };

  // Handlers for hierarchical item creation
  const handleAddStep = (milestoneId: string) => {
    // TODO: Implement step creation modal
    console.log("Add step to milestone:", milestoneId);
  };

  const handleAddBepic = (stepId: string) => {
    // TODO: Implement bepic creation modal
    console.log("Add bepic to step:", stepId);
  };

  const handleAddEpic = (bepicId: string) => {
    // TODO: Implement epic creation modal
    console.log("Add epic to bepic:", bepicId);
  };

  const handleAddStory = (epicId: string) => {
    // TODO: Implement story creation modal
    console.log("Add story to epic:", epicId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMilestoneMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "at_risk": return "bg-red-100 text-red-800";
      case "delayed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredMilestones = milestones.filter((milestone: any) => 
    filterStatus === "all" || milestone.status === filterStatus
  );

  const handleNewMilestone = () => {
    setShowCreateModal(true);
  };

  const handleViewMilestoneContext = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    fetchContextMutation.mutate(milestone.id);
  };

  const handleViewComponent = (type: string, programId?: string) => {
    switch (type) {
      case 'risks':
        setLocation(`/risk-management${programId ? `?programId=${programId}` : ''}`);
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

  const formatMilestoneDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Milestone Management"
        subtitle="Track and manage program milestones with critical path visualization"
        onNewClick={handleNewMilestone}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Filters */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <Label htmlFor="status-filter" className="text-sm font-medium">Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Milestones Content */}
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="hierarchy">Hierarchical View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-6">
            {/* Milestones Grid */}
            {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMilestones.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-12 text-center">
              <Flag size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones found</h3>
              <div className="text-gray-500 mb-4">
                {filterStatus === "all" 
                  ? programs.length > 0 
                    ? (
                      <div>
                        <p className="mb-3">The following programs are missing milestones:</p>
                        <ul className="space-y-2 mb-4">
                          {programs.map(program => (
                            <li key={program.id} className="flex items-center gap-2 text-sm bg-yellow-50 px-3 py-2 rounded border-l-4 border-yellow-400">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <span className="font-medium">Program "</span>
                              <button 
                                className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                onClick={() => setLocation(`/program-planning?id=${program.id}`)}
                              >
                                {program.name}
                              </button>
                              <span className="font-medium">"</span>
                              <span className="text-gray-600">has no milestones defined</span>
                            </li>
                          ))}
                        </ul>
                        <p>Get started by creating milestones to track progress and deadlines.</p>
                      </div>
                    )
                    : <p>Get started by creating your first milestone.</p>
                  : <p>No milestones with status "{filterStatus.replace("_", " ")}" found.</p>
                }
              </div>
              <Button onClick={handleNewMilestone} className="bg-primary-500 text-white hover:bg-primary-600">
                <Plus size={16} className="mr-2" />
                Create Milestone
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMilestones.map((milestone: any) => (
              <Card key={milestone.id} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {milestone.description || "No description provided"}
                      </p>
                    </div>
                    {milestone.jiraEpicKey && (
                      <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600">
                        <ExternalLink size={14} />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge className={`${getStatusColor(milestone.status)} font-medium capitalize`}>
                        {milestone.status?.replace("_", " ") || "not started"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Due Date:</span>
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar size={14} />
                        {formatMilestoneDate(milestone.dueDate)}
                      </div>
                    </div>

                    {milestone.owner && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Owner:</span>
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <User size={14} />
                          {milestone.owner.name}
                        </div>
                      </div>
                    )}

                    {milestone.program && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Program:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {milestone.program.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewMilestoneContext(milestone)}
                        disabled={fetchContextMutation.isPending}
                      >
                        <Eye size={14} className="mr-1" />
                        {fetchContextMutation.isPending ? "Loading..." : "View Context"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="hierarchy" className="space-y-6">
            {/* Hierarchical View */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMilestones.length === 0 ? (
              <Card className="border border-gray-200">
                <CardContent className="p-12 text-center">
                  <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No milestone hierarchy found</h3>
                  <p className="text-gray-500 mb-4">
                    Create milestones and add steps, bepics, epics, and stories to build your project hierarchy.
                  </p>
                  <Button onClick={handleNewMilestone} className="bg-primary-500 text-white hover:bg-primary-600">
                    <Plus size={16} className="mr-2" />
                    Create First Milestone
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredMilestones.map((milestone: Milestone) => (
                  <MilestoneHierarchy
                    key={milestone.id}
                    milestone={milestone}
                    steps={milestoneSteps}
                    bepics={jiraBepics}
                    epics={jiraEpics}
                    stories={jiraStories}
                    onAddStep={handleAddStep}
                    onAddBepic={handleAddBepic}
                    onAddEpic={handleAddEpic}
                    onAddStory={handleAddStory}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Milestone Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Milestone</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Milestone Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Write a clear, specific milestone title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the milestone objectives and success criteria"
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
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            {!isTestMode && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pushToJira"
                  checked={formData.pushToJira}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pushToJira: !!checked }))}
                />
                <Label htmlFor="pushToJira" className="text-sm">
                  Push to JIRA as Epic
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
                disabled={createMilestoneMutation.isPending}
              >
                {createMilestoneMutation.isPending ? "Creating..." : "Create Milestone"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Context Modal */}
      <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              {selectedMilestone?.title} - Contextual View
            </DialogTitle>
          </DialogHeader>

          {contextData && (
            <div className="space-y-6">
              {/* Milestone Details & Program Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Milestone Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <Badge className={getStatusColor(contextData.milestone.status)}>
                          {contextData.milestone.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Due Date:</span>
                        <span className="text-sm">{formatMilestoneDate(contextData.milestone.dueDate)}</span>
                      </div>
                      {contextData.milestone.description && (
                        <div className="pt-2 border-t">
                          <span className="text-sm text-gray-500">Description:</span>
                          <p className="text-sm mt-1">{contextData.milestone.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {contextData.program && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Program Context</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium">{contextData.program.name}</h4>
                          <p className="text-sm text-gray-600">{contextData.program.description || "No description"}</p>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Status:</span>
                          <Badge className={getStatusColor(contextData.program.status)}>
                            {contextData.program.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewComponent('programs')}
                          className="w-full mt-2"
                        >
                          View Program Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Analytics Overview */}
              {contextData.analytics && (
                <ComponentAnalytics 
                  title="Program"
                  data={contextData.analytics}
                />
              )}

              {/* Related Components */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                <ComponentContextCard
                  title="Risks"
                  type="risks"
                  items={contextData.relatedComponents.risks || []}
                  onViewAll={() => handleViewComponent('risks', contextData.program?.id)}
                  onViewItem={(item) => console.log('View risk:', item)}
                  analytics={{
                    total: contextData.relatedComponents.risks?.length || 0,
                    critical: contextData.analytics?.criticalRisks || 0
                  }}
                />

                <ComponentContextCard
                  title="Dependencies"
                  type="dependencies"
                  items={contextData.relatedComponents.dependencies || []}
                  onViewAll={() => handleViewComponent('dependencies', contextData.program?.id)}
                  onViewItem={(item) => console.log('View dependency:', item)}
                  analytics={{
                    total: contextData.relatedComponents.dependencies?.length || 0,
                    blocked: contextData.analytics?.blockedDependencies || 0
                  }}
                />

                <ComponentContextCard
                  title="Adopters"
                  type="adopters"
                  items={contextData.relatedComponents.adopters || []}
                  onViewAll={() => handleViewComponent('adopters', contextData.program?.id)}
                  onViewItem={(item) => console.log('View adopter:', item)}
                  analytics={{
                    total: contextData.relatedComponents.adopters?.length || 0,
                    ready: contextData.analytics?.readyAdopters || 0
                  }}
                />

                <ComponentContextCard
                  title="Other Milestones"
                  type="milestones"
                  items={contextData.relatedComponents.milestones || []}
                  onViewAll={() => handleViewComponent('milestones', contextData.program?.id)}
                  onViewItem={(item) => console.log('View milestone:', item)}
                  analytics={{
                    total: contextData.relatedComponents.milestones?.length || 0,
                    overdue: 0 // Calculate based on due dates
                  }}
                />
              </div>

              {/* Projects if available */}
              {contextData.relatedComponents.projects && contextData.relatedComponents.projects.length > 0 && (
                <ComponentContextCard
                  title="Related Projects"
                  type="projects"
                  items={contextData.relatedComponents.projects}
                  onViewAll={() => handleViewComponent('projects', contextData.program?.id)}
                  onViewItem={(item) => console.log('View project:', item)}
                  analytics={{
                    total: contextData.relatedComponents.projects.length
                  }}
                />
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewComponent('risks', contextData.program?.id)}>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      View All Risks
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleViewComponent('dependencies', contextData.program?.id)}>
                      <GitBranch className="h-4 w-4 mr-1" />
                      View All Dependencies
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleViewComponent('adopters', contextData.program?.id)}>
                      <Users className="h-4 w-4 mr-1" />
                      View All Adopters
                    </Button>
                    {contextData.program && (
                      <Button size="sm" variant="outline" onClick={() => handleViewComponent('programs')}>
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Go to Program
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
