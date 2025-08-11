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
  X
} from "lucide-react";
import type { Platform, Initiative, Program, InsertPlatform } from "@shared/schema";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'platforms' | 'initiatives' | 'programs'>('platforms');
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

  const [initiativeForm, setInitiativeForm] = useState({
    name: "",
    description: "",
    status: "planning" as const
  });

  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    status: "planning" as const,
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Settings"
        subtitle="Manage platforms, initiatives, and programs"
        icon={SettingsIcon}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
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
                  <Card key={i} className="border border-gray-200">
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
                  <Card key={platform.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: platform.color }}
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

            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p>Initiative management coming soon...</p>
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

            <div className="text-center py-8 text-gray-500">
              <ChartGantt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p>Advanced program management coming soon...</p>
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
    </div>
  );
}