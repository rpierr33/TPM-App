import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Plus,
  Edit,
  Trash2,
  Archive,
  ChartGantt,
  Target,
  Calendar,
  MapPin,
  Palette,
  Check,
  X,
  Link2,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react";
import type { Platform, Initiative, Program, InsertPlatform } from "@shared/schema";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'platforms' | 'initiatives' | 'programs' | 'jira'>('platforms');
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  
  const [platformForm, setPlatformForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  });

  const [initiativeForm, setInitiativeForm] = useState<{
    name: string;
    description: string;
    status: "planning" | "active" | "completed";
  }>({
    name: "",
    description: "",
    status: "planning"
  });

  const [programForm, setProgramForm] = useState<{
    name: string;
    description: string;
    status: "planning" | "active" | "completed";
    platformId: string;
    actualStartDate: string;
    estimatedCompletionPercentage: number;
  }>({
    name: "",
    description: "",
    status: "planning",
    platformId: "",
    actualStartDate: "",
    estimatedCompletionPercentage: 0
  });

  const { toast } = useToast();

  // Data queries
  const { data: platforms = [], isLoading: platformsLoading } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const { data: initiatives = [], isLoading: initiativesLoading } = useQuery<Initiative[]>({
    queryKey: ["/api/initiatives"],
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: jiraStatus, isLoading: jiraLoading, refetch: refetchJira } = useQuery<{
    connected: boolean;
    user: string | null;
    projects: { id: string; key: string; name: string; projectTypeKey: string }[];
    error?: string;
  }>({
    queryKey: ["/api/jira/status"],
    enabled: activeTab === 'jira',
  });

  // Platform mutations
  const createPlatformMutation = useMutation({
    mutationFn: async (data: InsertPlatform) => {
      return apiRequest("/api/platforms", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Platform created successfully" });
      setShowPlatformModal(false);
      setPlatformForm({ name: "", description: "", color: "#3B82F6" });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create platform", variant: "destructive" });
    },
  });

  const updatePlatformMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Platform> }) => {
      return apiRequest(`/api/platforms/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Platform updated successfully" });
      setShowPlatformModal(false);
      setEditingPlatform(null);
      setPlatformForm({ name: "", description: "", color: "#3B82F6" });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update platform", variant: "destructive" });
    },
  });

  const deletePlatformMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/platforms/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Platform deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete platform", variant: "destructive" });
    },
  });

  // Handle opening modals for editing
  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatform(platform);
    setPlatformForm({
      name: platform.name,
      description: platform.description || "",
      color: platform.color || "#3B82F6"
    });
    setShowPlatformModal(true);
  };

  // Handle form submissions
  const handlePlatformSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformForm.name.trim()) {
      toast({ title: "Error", description: "Platform name is required", variant: "destructive" });
      return;
    }

    if (editingPlatform) {
      updatePlatformMutation.mutate({
        id: editingPlatform.id,
        data: platformForm
      });
    } else {
      createPlatformMutation.mutate(platformForm);
    }
  };

  // Initiative mutations
  const createInitiativeMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; status: string }) => {
      return apiRequest("/api/initiatives", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Initiative created successfully" });
      setShowInitiativeModal(false);
      setInitiativeForm({ name: "", description: "", status: "planning" });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create initiative", variant: "destructive" });
    },
  });

  const updateInitiativeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Initiative> }) => {
      return apiRequest(`/api/initiatives/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Initiative updated successfully" });
      setShowInitiativeModal(false);
      setEditingInitiative(null);
      setInitiativeForm({ name: "", description: "", status: "planning" });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update initiative", variant: "destructive" });
    },
  });

  const deleteInitiativeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/initiatives/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Initiative deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete initiative", variant: "destructive" });
    },
  });

  // Program mutations
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Program> }) => {
      return apiRequest(`/api/programs/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Program updated successfully" });
      setShowProgramModal(false);
      setEditingProgram(null);
      setProgramForm({ name: "", description: "", status: "planning", platformId: "", actualStartDate: "", estimatedCompletionPercentage: 0 });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update program", variant: "destructive" });
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/programs/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Program deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete program", variant: "destructive" });
    },
  });

  const handleEditInitiative = (initiative: Initiative) => {
    setEditingInitiative(initiative);
    setInitiativeForm({
      name: initiative.name,
      description: initiative.description || "",
      status: (initiative.status as "planning" | "active" | "completed") || "planning"
    });
    setShowInitiativeModal(true);
  };

  const handleInitiativeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initiativeForm.name.trim()) {
      toast({ title: "Error", description: "Initiative name is required", variant: "destructive" });
      return;
    }
    if (editingInitiative) {
      updateInitiativeMutation.mutate({ id: editingInitiative.id, data: initiativeForm });
    } else {
      createInitiativeMutation.mutate(initiativeForm);
    }
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setProgramForm({
      name: program.name,
      description: program.description || "",
      status: (program.status as "planning" | "active" | "completed") || "planning",
      platformId: program.platformId || "",
      actualStartDate: "",
      estimatedCompletionPercentage: program.estimatedCompletionPercentage || 0
    });
    setShowProgramModal(true);
  };

  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;
    if (!programForm.name.trim()) {
      toast({ title: "Error", description: "Program name is required", variant: "destructive" });
      return;
    }
    updateProgramMutation.mutate({
      id: editingProgram.id,
      data: {
        name: programForm.name,
        description: programForm.description,
        status: programForm.status,
        platformId: programForm.platformId || null,
      }
    });
  };

  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "planning": return "bg-amber-100 text-amber-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green  
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#84CC16", // Lime
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title="Settings"
        subtitle="Manage platforms, initiatives, and programs"
      />

      <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === 'platforms' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('platforms')}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Platforms
          </Button>
          <Button
            variant={activeTab === 'initiatives' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('initiatives')}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Initiatives
          </Button>
          <Button
            variant={activeTab === 'programs' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('programs')}
            className="flex items-center gap-2"
          >
            <ChartGantt className="h-4 w-4" />
            Programs
          </Button>
          <Button
            variant={activeTab === 'jira' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('jira')}
            className="flex items-center gap-2"
          >
            <Link2 className="h-4 w-4" />
            Jira
          </Button>
        </div>

        {/* Platforms Tab */}
        {activeTab === 'platforms' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Platform Management</h2>
                <p className="text-sm text-gray-600">Manage platforms that programs can belong to</p>
              </div>
              <Button onClick={() => setShowPlatformModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Platform
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border border-gray-200/80 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                platforms.map((platform) => (
                  <Card key={platform.id} className="border border-gray-200/80 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: platform.color ?? undefined }}
                          />
                          <h3 className="font-medium text-gray-900">{platform.name}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPlatform(platform)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePlatformMutation.mutate(platform.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {platform.description && (
                        <p className="text-sm text-gray-600 mb-3">{platform.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge className={platform.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {platform.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {programs.filter(p => p.platformId === platform.id).length} programs
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Initiatives Tab */}
        {activeTab === 'initiatives' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Initiative Management</h2>
                <p className="text-sm text-gray-600">Manage strategic initiatives that span multiple programs</p>
              </div>
              <Button onClick={() => setShowInitiativeModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Initiative
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initiativesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border border-gray-200/80 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : initiatives.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No initiatives yet. Create one to get started.</p>
                </div>
              ) : (
                initiatives.map((initiative) => (
                  <Card key={initiative.id} className="border border-gray-200/80 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{initiative.name}</h3>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditInitiative(initiative)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteInitiativeMutation.mutate(initiative.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {initiative.description && (
                        <p className="text-sm text-gray-600 mb-3">{initiative.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusBadgeClass(initiative.status)}>
                          {initiative.status || "planning"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Created {initiative.createdAt ? new Date(initiative.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Programs Tab */}
        {activeTab === 'programs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Program Management</h2>
                <p className="text-sm text-gray-600">Manage all programs including mid-execution additions</p>
              </div>
              <Button onClick={() => setShowProgramModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Program
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border border-gray-200/80 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : programs.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <ChartGantt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No programs yet. Create one to get started.</p>
                </div>
              ) : (
                programs.map((program) => {
                  const platform = platforms.find(p => p.id === program.platformId);
                  return (
                    <Card key={program.id} className="border border-gray-200/80 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-medium text-gray-900">{program.name}</h3>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditProgram(program)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteProgramMutation.mutate(program.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {program.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{program.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeClass(program.status)}>
                              {program.status || "planning"}
                            </Badge>
                            {platform && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: platform.color ?? undefined }}
                                />
                                {platform.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Jira Tab */}
        {activeTab === 'jira' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Jira Integration</h2>
                <p className="text-sm text-gray-600">Connect your Jira account to sync issues with programs</p>
              </div>
              <Button
                onClick={() => refetchJira()}
                variant="outline"
                className="flex items-center gap-2"
                disabled={jiraLoading}
              >
                <RefreshCw className={`h-4 w-4 ${jiraLoading ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Connection Status Card */}
              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {jiraLoading ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                    ) : jiraStatus?.connected ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Connection Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {jiraLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ) : jiraStatus?.connected ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Authenticated as:</p>
                        <p className="font-medium text-gray-900">{jiraStatus.user}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800">Not Connected</Badge>
                      </div>
                      {jiraStatus?.error && (
                        <p className="text-sm text-red-600">{jiraStatus.error}</p>
                      )}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-2">Setup Instructions</p>
                        <p className="text-sm text-gray-600 mb-2">
                          Set the following environment variables on Vercel:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">JIRA_DOMAIN</code> — Your Atlassian domain (e.g., yourteam.atlassian.net)</li>
                          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">JIRA_EMAIL</code> — Your Jira account email</li>
                          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">JIRA_API_TOKEN</code> — API token from id.atlassian.com</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Jira Projects Card */}
              <Card className="border border-gray-200/80 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Jira Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  {jiraLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  ) : !jiraStatus?.connected ? (
                    <p className="text-sm text-gray-500 text-center py-4">Connect to Jira to see projects</p>
                  ) : jiraStatus.projects.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No projects found in your Jira account</p>
                  ) : (
                    <div className="space-y-2">
                      {jiraStatus.projects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{project.name}</p>
                            <p className="text-sm text-gray-500">Key: {project.key}</p>
                          </div>
                          <Badge variant="outline">{project.projectTypeKey}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Platform Modal */}
      <Dialog open={showPlatformModal} onOpenChange={(open) => {
        setShowPlatformModal(open);
        if (!open) {
          setEditingPlatform(null);
          setPlatformForm({ name: "", description: "", color: "#3B82F6" });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPlatform ? "Edit Platform" : "Create New Platform"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePlatformSubmit} className="space-y-4">
            <div>
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                value={platformForm.name}
                onChange={(e) => setPlatformForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter platform name"
                required
              />
            </div>
            <div>
              <Label htmlFor="platform-description">Description</Label>
              <Textarea
                id="platform-description"
                value={platformForm.description}
                onChange={(e) => setPlatformForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter platform description"
                rows={3}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      platformForm.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPlatformForm(prev => ({ ...prev, color }))}
                  >
                    {platformForm.color === color && (
                      <Check className="h-4 w-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPlatformModal(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPlatformMutation.isPending || updatePlatformMutation.isPending}
              >
                {(createPlatformMutation.isPending || updatePlatformMutation.isPending) 
                  ? "Saving..." 
                  : editingPlatform 
                    ? "Update Platform" 
                    : "Create Platform"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Initiative Modal */}
      <Dialog open={showInitiativeModal} onOpenChange={(open) => {
        setShowInitiativeModal(open);
        if (!open) {
          setEditingInitiative(null);
          setInitiativeForm({ name: "", description: "", status: "planning" });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingInitiative ? "Edit Initiative" : "Create New Initiative"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInitiativeSubmit} className="space-y-4">
            <div>
              <Label htmlFor="initiative-name">Initiative Name</Label>
              <Input
                id="initiative-name"
                value={initiativeForm.name}
                onChange={(e) => setInitiativeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter initiative name"
                required
              />
            </div>
            <div>
              <Label htmlFor="initiative-description">Description</Label>
              <Textarea
                id="initiative-description"
                value={initiativeForm.description}
                onChange={(e) => setInitiativeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter initiative description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="initiative-status">Status</Label>
              <Select
                value={initiativeForm.status}
                onValueChange={(value) => setInitiativeForm(prev => ({ ...prev, status: value as "planning" | "active" | "completed" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInitiativeModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInitiativeMutation.isPending || updateInitiativeMutation.isPending}
              >
                {(createInitiativeMutation.isPending || updateInitiativeMutation.isPending)
                  ? "Saving..."
                  : editingInitiative
                    ? "Update Initiative"
                    : "Create Initiative"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Program Modal */}
      <Dialog open={showProgramModal} onOpenChange={(open) => {
        setShowProgramModal(open);
        if (!open) {
          setEditingProgram(null);
          setProgramForm({ name: "", description: "", status: "planning", platformId: "", actualStartDate: "", estimatedCompletionPercentage: 0 });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? "Edit Program" : "Program Details"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProgramSubmit} className="space-y-4">
            <div>
              <Label htmlFor="program-name">Program Name</Label>
              <Input
                id="program-name"
                value={programForm.name}
                onChange={(e) => setProgramForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter program name"
                required
              />
            </div>
            <div>
              <Label htmlFor="program-description">Description</Label>
              <Textarea
                id="program-description"
                value={programForm.description}
                onChange={(e) => setProgramForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter program description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="program-status">Status</Label>
              <Select
                value={programForm.status}
                onValueChange={(value) => setProgramForm(prev => ({ ...prev, status: value as "planning" | "active" | "completed" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="program-platform">Platform</Label>
              <Select
                value={programForm.platformId}
                onValueChange={(value) => setProgramForm(prev => ({ ...prev, platformId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProgramModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProgramMutation.isPending}
              >
                {updateProgramMutation.isPending ? "Saving..." : "Update Program"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}