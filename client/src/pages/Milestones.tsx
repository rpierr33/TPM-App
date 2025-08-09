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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Flag, Calendar, User, ExternalLink, Plus, Filter } from "lucide-react";
import { useMode } from "@/hooks/useMode";
import type { Milestone, Program } from "@shared/schema";

export default function Milestones() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
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

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
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
              <p className="text-gray-500 mb-4">
                {filterStatus === "all" 
                  ? "Get started by creating your first milestone."
                  : `No milestones with status "${filterStatus.replace("_", " ")}" found.`
                }
              </p>
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
                        {formatDate(milestone.dueDate)}
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
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
    </div>
  );
}
