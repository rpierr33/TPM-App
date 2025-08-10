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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentContextCard } from "@/components/layout/ComponentContextCard";
import { ComponentAnalytics } from "@/components/layout/ComponentAnalytics";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { GitBranch, Plus, Filter, Eye, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useMode } from "@/hooks/useMode";
import type { Dependency, Program } from "@shared/schema";

export default function Dependencies() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedDependency, setSelectedDependency] = useState<Dependency | null>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    programId: "",
    type: "internal",
    status: "open",
    priority: "medium",
    ownerTeam: "",
    dependentTeam: "",
    dueDate: "",
    resolution: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isTestMode } = useMode();
  const [, setLocation] = useLocation();

  const { data: dependencies = [], isLoading } = useQuery<Dependency[]>({
    queryKey: ["/api/dependencies"],
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const createDependencyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/dependencies", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dependency created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dependencies"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create dependency",
        variant: "destructive",
      });
    },
  });

  const fetchContextMutation = useMutation({
    mutationFn: async (dependencyId: string) => {
      return await apiRequest(`/api/dependencies/${dependencyId}/context`, "GET");
    },
    onSuccess: (data: any) => {
      setContextData(data);
      setShowContextModal(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to load dependency context",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      programId: "",
      type: "internal",
      status: "open",
      priority: "medium",
      ownerTeam: "",
      dependentTeam: "",
      dueDate: "",
      resolution: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDependencyMutation.mutate(formData);
  };

  const handleNewDependency = () => {
    setShowCreateModal(true);
  };

  const handleViewDependencyContext = (dependency: Dependency) => {
    setSelectedDependency(dependency);
    fetchContextMutation.mutate(dependency.id);
  };

  const handleViewComponent = (type: string, programId?: string) => {
    switch (type) {
      case 'milestones':
        setLocation(`/milestones${programId ? `?programId=${programId}` : ''}`);
        break;
      case 'risks':
        setLocation(`/risk-management${programId ? `?programId=${programId}` : ''}`);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "blocked": return "bg-red-100 text-red-800";
      case "open": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved": return <CheckCircle size={16} className="text-green-600" />;
      case "blocked": return <XCircle size={16} className="text-red-600" />;
      case "in_progress": return <Clock size={16} className="text-yellow-600" />;
      default: return <GitBranch size={16} className="text-blue-600" />;
    }
  };

  const filteredDependencies = dependencies.filter((dep: any) => {
    const statusMatch = filterStatus === "all" || dep.status === filterStatus;
    const typeMatch = filterType === "all" || dep.type === filterType;
    return statusMatch && typeMatch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Dependencies"
        subtitle="Track cross-team dependencies and unblock critical paths"
        onNewClick={handleNewDependency}
        newButtonText="Add Dependency"
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <Tabs defaultValue="dependencies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dependencies">Dependency Registry</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dependencies" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <Label className="text-sm font-medium">Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Type:</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dependencies Table */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dependency Registry</CardTitle>
                  <Button size="sm" onClick={handleNewDependency} className="bg-primary-500 text-white hover:bg-primary-600">
                    <Plus size={14} className="mr-1" />
                    New Dependency
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12">
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                ) : filteredDependencies.length === 0 ? (
                  <div className="p-12 text-center">
                    <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No dependencies found</h3>
                    <div className="text-gray-500 mb-4">
                      {filterStatus === "all" && filterType === "all"
                        ? programs.length > 0 
                          ? (
                            <div>
                              <p className="mb-3">The following programs are missing dependency tracking:</p>
                              <ul className="space-y-2 mb-4">
                                {programs.map(program => (
                                  <li key={program.id} className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded border-l-4 border-blue-400">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="font-medium">Program "</span>
                                    <button 
                                      className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                      onClick={() => setLocation(`/program-planning?id=${program.id}`)}
                                    >
                                      {program.name}
                                    </button>
                                    <span className="font-medium">"</span>
                                    <span className="text-gray-600">has no dependencies documented</span>
                                  </li>
                                ))}
                              </ul>
                              <p>Get started by documenting cross-team dependencies to prevent blockers.</p>
                            </div>
                          )
                          : <p>Start by documenting cross-team dependencies.</p>
                        : <p>No dependencies match the selected filters.</p>
                      }
                    </div>
                    <Button onClick={handleNewDependency} className="bg-primary-500 text-white hover:bg-primary-600">
                      <Plus size={16} className="mr-2" />
                      Create Dependency
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dependency
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Program
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDependencies.map((dependency: any) => {
                          const program = programs.find(p => p.id === dependency.programId);
                          return (
                            <tr key={dependency.id}>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {getStatusIcon(dependency.status)}
                                    {dependency.title}
                                  </div>
                                  <div className="text-sm text-gray-500 max-w-xs truncate">
                                    {dependency.description}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <Badge variant="outline" className="text-xs">
                                  {program?.name || "N/A"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="outline" className="capitalize">
                                  {dependency.type || "internal"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={`${getStatusColor(dependency.status)} font-semibold capitalize`}>
                                  {dependency.status?.replace("_", " ") || "open"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={`${getPriorityColor(dependency.priority)} font-semibold capitalize`}>
                                  {dependency.priority || "medium"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {dependency.dueDate ? new Date(dependency.dueDate).toLocaleDateString() : "Not set"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button variant="ghost" size="sm" onClick={() => handleViewDependencyContext(dependency)} className="text-blue-600 hover:text-blue-800">
                                  <Eye size={14} className="mr-1" />
                                  View Context
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Total Dependencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dependencies.length}</div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Blocked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {dependencies.filter((d: any) => d.status === 'blocked').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {dependencies.filter((d: any) => d.status === 'resolved').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Dependency Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Dependency</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Dependency Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Describe the dependency clearly"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed description of the dependency"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="programId">Program</Label>
                <Select value={formData.programId} onValueChange={(value) => setFormData(prev => ({ ...prev, programId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program: Program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerTeam">Owner Team</Label>
                <Input
                  id="ownerTeam"
                  value={formData.ownerTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerTeam: e.target.value }))}
                  placeholder="Team responsible for resolving"
                />
              </div>

              <div>
                <Label htmlFor="dependentTeam">Dependent Team</Label>
                <Input
                  id="dependentTeam"
                  value={formData.dependentTeam}
                  onChange={(e) => setFormData(prev => ({ ...prev, dependentTeam: e.target.value }))}
                  placeholder="Team waiting on this dependency"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="resolution">Resolution Plan</Label>
              <Textarea
                id="resolution"
                value={formData.resolution}
                onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
                placeholder="Describe the plan to resolve this dependency"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary-500 text-white hover:bg-primary-600" disabled={createDependencyMutation.isPending}>
                {createDependencyMutation.isPending ? "Creating..." : "Create Dependency"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dependency Context Modal */}
      <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="text-blue-600" size={20} />
              Dependency Context: {selectedDependency?.title}
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
                title="Related Risks"
                items={contextData.relatedComponents.risks || []}
                type="risks"
                onViewAll={() => handleViewComponent('risks', contextData.program?.id)}
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