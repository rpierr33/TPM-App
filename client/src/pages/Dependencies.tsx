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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, GitBranch, Plus, Filter, AlertCircle } from "lucide-react";
import type { Dependency, Program, Milestone } from "@shared/schema";

export default function Dependencies() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    programId: "",
    upstreamId: "",
    downstreamId: "",
    status: "on_track",
    ownerId: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dependencies = [], isLoading } = useQuery<Dependency[]>({
    queryKey: ["/api/dependencies"],
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      programId: "",
      upstreamId: "",
      downstreamId: "",
      status: "on_track",
      ownerId: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDependencyMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-800";
      case "on_track": return "bg-blue-100 text-blue-800";
      case "at_risk": return "bg-yellow-100 text-yellow-800";
      case "blocked": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredDependencies = dependencies.filter((dep: any) => 
    filterStatus === "all" || dep.status === filterStatus
  );

  const handleNewDependency = () => {
    setShowCreateModal(true);
  };

  // Mock dependency graph data for visualization
  const getDependencyNodes = () => {
    const nodes = new Map();
    dependencies.forEach((dep: any) => {
      if (dep.upstreamId && !nodes.has(dep.upstreamId)) {
        nodes.set(dep.upstreamId, { id: dep.upstreamId, label: `Upstream ${dep.upstreamId.slice(0, 8)}`, type: 'upstream' });
      }
      if (dep.downstreamId && !nodes.has(dep.downstreamId)) {
        nodes.set(dep.downstreamId, { id: dep.downstreamId, label: `Downstream ${dep.downstreamId.slice(0, 8)}`, type: 'downstream' });
      }
    });
    return Array.from(nodes.values());
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Dependency Tracking"
        subtitle="Track cross-team dependencies with upstream/downstream relationships"
        onNewClick={handleNewDependency}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Dependencies List</TabsTrigger>
            <TabsTrigger value="graph">Dependency Graph</TabsTrigger>
            <TabsTrigger value="analysis">Impact Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <Label className="text-sm font-medium">Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dependencies Table */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cross-Team Dependencies</CardTitle>
                  <Button size="sm" onClick={handleNewDependency} className="bg-primary-500 text-white hover:bg-primary-600">
                    <Plus size={14} className="mr-1" />
                    Add Dependency
                  </Button>
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
                ) : filteredDependencies.length === 0 ? (
                  <div className="p-12 text-center">
                    <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No dependencies found</h3>
                    <p className="text-gray-500 mb-4">
                      {filterStatus === "all"
                        ? "Start by mapping cross-team dependencies for better coordination."
                        : `No dependencies with status "${filterStatus.replace("_", " ")}" found.`
                      }
                    </p>
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
                            Relationship
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
                        {filteredDependencies.map((dependency: any) => (
                          <tr key={dependency.id}>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{dependency.title}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {dependency.description}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-900">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {dependency.upstreamId ? dependency.upstreamId.slice(0, 8) : "None"}
                                </span>
                                <ArrowRight size={14} className="text-gray-400" />
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  {dependency.downstreamId ? dependency.downstreamId.slice(0, 8) : "None"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dependency.owner?.name || "Unassigned"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`${getStatusColor(dependency.status)} font-semibold capitalize`}>
                                {dependency.status?.replace("_", " ") || "on track"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">Edit</Button>
                                <Button variant="ghost" size="sm">View</Button>
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

          <TabsContent value="graph" className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Dependency Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Dependency Graph</h3>
                    <p className="text-gray-500 mb-4">
                      This would display an interactive network graph showing all dependency relationships
                    </p>
                    <div className="text-sm text-gray-600">
                      • Upstream dependencies (blockers)
                      <br />
                      • Downstream dependencies (blocked items)
                      <br />
                      • Critical path visualization
                      <br />
                      • Risk propagation analysis
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Blocked Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dependencies.filter((d: any) => d.status === "blocked").slice(0, 5).map((dep: any) => (
                      <div key={dep.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                        <AlertCircle className="text-red-500" size={16} />
                        <div className="flex-1">
                          <div className="font-medium text-red-700">{dep.title}</div>
                          <div className="text-sm text-red-600">{dep.description}</div>
                        </div>
                      </div>
                    ))}
                    {dependencies.filter((d: any) => d.status === "blocked").length === 0 && (
                      <p className="text-gray-500 text-center py-4">No blocked dependencies</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>At Risk Dependencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dependencies.filter((d: any) => d.status === "at_risk").slice(0, 5).map((dep: any) => (
                      <div key={dep.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <AlertCircle className="text-yellow-500" size={16} />
                        <div className="flex-1">
                          <div className="font-medium text-yellow-700">{dep.title}</div>
                          <div className="text-sm text-yellow-600">{dep.description}</div>
                        </div>
                      </div>
                    ))}
                    {dependencies.filter((d: any) => d.status === "at_risk").length === 0 && (
                      <p className="text-gray-500 text-center py-4">No at-risk dependencies</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-center">Critical Path</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-primary-500 mb-2">
                    {dependencies.filter((d: any) => d.status === "blocked").length}
                  </div>
                  <p className="text-sm text-gray-600">Items on critical path</p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-center">Risk Exposure</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-warning mb-2">
                    {dependencies.filter((d: any) => d.status === "at_risk").length}
                  </div>
                  <p className="text-sm text-gray-600">Dependencies at risk</p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-center">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-success mb-2">
                    {dependencies.length > 0 
                      ? Math.round((dependencies.filter((d: any) => d.status === "completed").length / dependencies.length) * 100)
                      : 0
                    }%
                  </div>
                  <p className="text-sm text-gray-600">Dependencies completed</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-700 mb-2">Cascade Impact Assessment</h4>
                    <p className="text-sm text-blue-600">
                      Analysis of how dependency delays could cascade through the program timeline.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-700 mb-2">Resource Bottlenecks</h4>
                    <p className="text-sm text-yellow-600">
                      Identification of team or resource bottlenecks that could impact multiple dependencies.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-700 mb-2">Mitigation Strategies</h4>
                    <p className="text-sm text-green-600">
                      Recommended actions to reduce dependency risks and improve program flow.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Dependency Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
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
                placeholder="Brief description of the dependency"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the dependency relationship"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="upstreamId">Upstream (Blocker)</Label>
                <Select value={formData.upstreamId} onValueChange={(value) => setFormData(prev => ({ ...prev, upstreamId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select upstream item" />
                  </SelectTrigger>
                  <SelectContent>
                    {milestones.map((milestone: any) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="downstreamId">Downstream (Blocked)</Label>
                <Select value={formData.downstreamId} onValueChange={(value) => setFormData(prev => ({ ...prev, downstreamId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select downstream item" />
                  </SelectTrigger>
                  <SelectContent>
                    {milestones.map((milestone: any) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary-500 text-white hover:bg-primary-600"
                disabled={createDependencyMutation.isPending}
              >
                {createDependencyMutation.isPending ? "Creating..." : "Create Dependency"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
