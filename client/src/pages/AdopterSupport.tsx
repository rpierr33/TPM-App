import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Filter, 
  MessageCircle, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Clock,
  TrendingUp,
  FileText,
  Mail
} from "lucide-react";
import type { Adopter, Program } from "@shared/schema";

export default function AdopterSupport() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    teamName: "",
    description: "",
    programId: "",
    status: "not_started",
    readinessScore: 0,
    contactId: "",
    onboardingNotes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adopters = [], isLoading } = useQuery<Adopter[]>({
    queryKey: ["/api/adopters"],
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const createAdopterMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/adopters", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Adopter team created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/adopters"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create adopter team",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      teamName: "",
      description: "",
      programId: "",
      status: "not_started",
      readinessScore: 0,
      contactId: "",
      onboardingNotes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdopterMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": 
      case "ready": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "blocked": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "ready": return CheckCircle;
      case "in_progress": return Clock;
      case "blocked": return AlertCircle;
      default: return Clock;
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredAdopters = adopters.filter((adopter: any) => 
    filterStatus === "all" || adopter.status === filterStatus
  );

  const handleNewAdopter = () => {
    setShowCreateModal(true);
  };

  const getAverageReadinessScore = () => {
    if (adopters.length === 0) return 0;
    const total = adopters.reduce((sum: number, adopter: any) => sum + (adopter.readinessScore || 0), 0);
    return Math.round(total / adopters.length);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Adopter Support"
        subtitle="Track internal feature/API adopters with onboarding status and readiness scoring"
        onNewClick={handleNewAdopter}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Adopter Teams</TabsTrigger>
            <TabsTrigger value="scorecards">Readiness Scorecards</TabsTrigger>
            <TabsTrigger value="feedback">Feedback & Support</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Teams</p>
                      <p className="text-3xl font-bold text-gray-900">{adopters.length}</p>
                    </div>
                    <Users className="text-blue-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ready Teams</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {adopters.filter((a: any) => a.status === "ready" || a.status === "completed").length}
                      </p>
                    </div>
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg Readiness</p>
                      <p className="text-3xl font-bold text-gray-900">{getAverageReadinessScore()}%</p>
                    </div>
                    <TrendingUp className="text-purple-500" size={24} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Blocked Teams</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {adopters.filter((a: any) => a.status === "blocked").length}
                      </p>
                    </div>
                    <AlertCircle className="text-red-500" size={24} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Recent Adopter Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adopters.slice(0, 5).map((adopter: any) => (
                    <div key={adopter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">{adopter.teamName}</p>
                          <p className="text-sm text-gray-600">Readiness score updated</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(adopter.status)}>
                          {adopter.status?.replace("_", " ") || "not started"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {adopters.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No adopter activity yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
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
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Adopters Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                        <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAdopters.length === 0 ? (
              <Card className="border border-gray-200">
                <CardContent className="p-12 text-center">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No adopter teams found</h3>
                  <div className="text-gray-500 mb-4">
                    {filterStatus === "all" 
                      ? programs.length > 0 
                        ? (
                          <div>
                            <p className="mb-3">The following programs are missing adopter tracking:</p>
                            <ul className="space-y-2 mb-4">
                              {programs.map(program => (
                                <li key={program.id} className="flex items-center gap-2 text-sm bg-green-50 px-3 py-2 rounded border-l-4 border-green-400">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="font-medium">Program "{program.name}"</span>
                                  <span className="text-gray-600">has no teams tracked</span>
                                </li>
                              ))}
                            </ul>
                            <p>Get started by adding teams and tracking their adoption readiness.</p>
                          </div>
                        )
                        : <p>Get started by adding adopter teams to track their onboarding progress.</p>
                      : <p>No teams with status "{filterStatus.replace("_", " ")}" found.</p>
                    }
                  </div>
                  <Button onClick={handleNewAdopter} className="bg-primary-500 text-white hover:bg-primary-600">
                    <Plus size={16} className="mr-2" />
                    Add Adopter Team
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAdopters.map((adopter: any) => {
                  const StatusIcon = getStatusIcon(adopter.status);
                  const readinessScore = adopter.readinessScore || 0;
                  
                  return (
                    <Card key={adopter.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {adopter.teamName}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {adopter.description || "No description provided"}
                            </p>
                          </div>
                          <StatusIcon size={20} className={getStatusColor(adopter.status).includes('green') ? 'text-green-500' : 
                                                           getStatusColor(adopter.status).includes('red') ? 'text-red-500' : 
                                                           getStatusColor(adopter.status).includes('blue') ? 'text-blue-500' : 'text-gray-500'} />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Readiness Score</span>
                              <span className={`text-sm font-semibold ${getReadinessColor(readinessScore)}`}>
                                {readinessScore}%
                              </span>
                            </div>
                            <Progress value={readinessScore} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Status:</span>
                            <Badge className={`${getStatusColor(adopter.status)} font-medium capitalize`}>
                              {adopter.status?.replace("_", " ") || "not started"}
                            </Badge>
                          </div>

                          {adopter.contact && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Contact:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {adopter.contact.name}
                              </span>
                            </div>
                          )}

                          {adopter.lastCheckIn && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Last Check-in:</span>
                              <span className="text-sm text-gray-900">
                                {new Date(adopter.lastCheckIn).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <MessageCircle size={14} className="mr-1" />
                              Message
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Calendar size={14} className="mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scorecards" className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Readiness Scorecards</CardTitle>
                  <Button size="sm" className="bg-primary-500 text-white hover:bg-primary-600">
                    <FileText size={14} className="mr-1" />
                    Export All Scorecards
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adopters.map((adopter: any) => (
                    <div key={adopter.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{adopter.teamName}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getReadinessColor(adopter.readinessScore || 0)}`}>
                            {adopter.readinessScore || 0}%
                          </span>
                          <Button variant="outline" size="sm">
                            <FileText size={14} className="mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Technical Setup</div>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.random() * 100} className="flex-1 h-2" />
                            <span className="text-xs font-medium">{Math.round(Math.random() * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Integration</div>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.random() * 100} className="flex-1 h-2" />
                            <span className="text-xs font-medium">{Math.round(Math.random() * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Testing</div>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.random() * 100} className="flex-1 h-2" />
                            <span className="text-xs font-medium">{Math.round(Math.random() * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Documentation</div>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.random() * 100} className="flex-1 h-2" />
                            <span className="text-xs font-medium">{Math.round(Math.random() * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {adopters.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No adopter teams to display scorecards for</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Feedback Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="text-blue-500" size={16} />
                        <span className="font-medium text-blue-700">Mobile App Team</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        "The API documentation is comprehensive, but we need more examples for edge cases."
                      </p>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="text-yellow-500" size={16} />
                        <span className="font-medium text-yellow-700">Web Platform Team</span>
                      </div>
                      <p className="text-sm text-yellow-600">
                        "Integration is smooth, but authentication flow needs clarification."
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="text-green-500" size={16} />
                        <span className="font-medium text-green-700">DevOps Team</span>
                      </div>
                      <p className="text-sm text-green-600">
                        "Deployment process is well documented and straightforward."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Support Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start bg-primary-500 text-white hover:bg-primary-600">
                      <Mail size={16} className="mr-2" />
                      Send Support Update
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar size={16} className="mr-2" />
                      Schedule Team Check-ins
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText size={16} className="mr-2" />
                      Generate Summary Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle size={16} className="mr-2" />
                      Create Support Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Adopter Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Adopter Team</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={formData.teamName}
                onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                placeholder="e.g., Mobile App Team, Data Analytics Team"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the team's integration needs and use case"
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
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="readinessScore">Initial Readiness Score (0-100)</Label>
              <Input
                id="readinessScore"
                type="number"
                min="0"
                max="100"
                value={formData.readinessScore}
                onChange={(e) => setFormData(prev => ({ ...prev, readinessScore: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="onboardingNotes">Onboarding Notes</Label>
              <Textarea
                id="onboardingNotes"
                value={formData.onboardingNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, onboardingNotes: e.target.value }))}
                placeholder="Any specific notes about the team's onboarding requirements"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary-500 text-white hover:bg-primary-600"
                disabled={createAdopterMutation.isPending}
              >
                {createAdopterMutation.isPending ? "Adding..." : "Add Adopter Team"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
