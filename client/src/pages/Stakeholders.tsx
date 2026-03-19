import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  UserCheck, Plus, ChevronDown, ChevronRight, Calendar, MessageSquare,
  CheckCircle, Clock, Star, TrendingUp, Edit, Trash2, AlertCircle,
  Pencil, Check, X
} from "lucide-react";
import type { Stakeholder, StakeholderInteraction, Program } from "@shared/schema";

const INFLUENCE_LABELS: Record<number, string> = { 1: "Very Low", 2: "Low", 3: "Medium", 4: "High", 5: "Very High" };
const SUPPORT_LABELS: Record<number, string> = { 1: "Opponent", 2: "Skeptic", 3: "Neutral", 4: "Supporter", 5: "Champion" };
const SUPPORT_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-800",
  2: "bg-orange-100 text-orange-800",
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-blue-100 text-blue-800",
  5: "bg-green-100 text-green-800",
};

export default function Stakeholders() {
  const [, setLocation] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterProgram, setFilterProgram] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; role: string }>({ name: "", role: "" });

  const [stakeholderForm, setStakeholderForm] = useState({
    name: "", email: "", role: "", department: "",
    programId: "", leadershipStyle: "", communicationStyle: "",
    decisionMakingStyle: "", influenceLevel: 3, supportLevel: 3,
  });

  const [interactionForm, setInteractionForm] = useState({
    interactionType: "Meeting",
    context: "",
    actualResponse: "",
    followUpRequired: false,
    followUpDate: "",
    recommendations: [] as string[],
    plannedStep: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stakeholders = [], isLoading } = useQuery<Stakeholder[]>({
    queryKey: ["/api/stakeholders"],
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: interactions = [] } = useQuery<StakeholderInteraction[]>({
    queryKey: ["/api/stakeholders", expandedId, "interactions"],
    queryFn: () => expandedId
      ? apiRequest(`/api/stakeholders/${expandedId}/interactions`, "GET")
      : Promise.resolve([]),
    enabled: !!expandedId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/stakeholders", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      setShowCreateModal(false);
      setStakeholderForm({ name: "", email: "", role: "", department: "", programId: "", leadershipStyle: "", communicationStyle: "", decisionMakingStyle: "", influenceLevel: 3, supportLevel: 3 });
      toast({ title: "Stakeholder added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add stakeholder", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/stakeholders/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      toast({ title: "Stakeholder removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove stakeholder", variant: "destructive" }),
  });

  const addInteractionMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/stakeholders/${selectedStakeholder!.id}/interactions`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakeholders", expandedId, "interactions"] });
      setShowInteractionModal(false);
      setInteractionForm({ interactionType: "Meeting", context: "", actualResponse: "", followUpRequired: false, followUpDate: "", recommendations: [], plannedStep: "" });
      toast({ title: "Interaction logged" });
    },
    onError: () => toast({ title: "Error", description: "Failed to log interaction", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/stakeholders/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakeholders"] });
      setEditingId(null);
      toast({ title: "Stakeholder updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update stakeholder", variant: "destructive" }),
  });

  const startEditingStakeholder = (s: Stakeholder) => {
    setEditingId(s.id);
    setEditValues({ name: s.name, role: s.role || "" });
  };

  const saveEditingStakeholder = (id: string) => {
    updateMutation.mutate({ id, data: editValues });
  };

  const cancelEditingStakeholder = () => {
    setEditingId(null);
  };

  const handleCreateStakeholder = () => {
    const payload = {
      ...stakeholderForm,
      programId: stakeholderForm.programId || null,
      influenceLevel: Number(stakeholderForm.influenceLevel),
      supportLevel: Number(stakeholderForm.supportLevel),
    };
    createMutation.mutate(payload);
  };

  const handleAddInteraction = () => {
    const recommendations = interactionForm.plannedStep
      ? [...interactionForm.recommendations, interactionForm.plannedStep]
      : interactionForm.recommendations;

    addInteractionMutation.mutate({
      interactionType: interactionForm.interactionType,
      context: interactionForm.context,
      actualResponse: interactionForm.actualResponse || null,
      followUpRequired: interactionForm.followUpRequired,
      followUpDate: interactionForm.followUpDate ? new Date(interactionForm.followUpDate) : null,
      recommendations,
    });
  };

  const filtered = filterProgram === "all"
    ? stakeholders
    : stakeholders.filter(s => s.programId === filterProgram);

  const champions = stakeholders.filter(s => (s.supportLevel ?? 0) >= 4).length;
  const opponents = stakeholders.filter(s => (s.supportLevel ?? 0) <= 2).length;
  const needsFollowUp = interactions.filter(i => i.followUpRequired && i.followUpDate && new Date(i.followUpDate) <= new Date(Date.now() + 7 * 86400000)).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title="Stakeholders"
        subtitle="Track stakeholder relationships, engagement steps, and planned actions"
        showNewButton
        onNewClick={() => setShowCreateModal(true)}
        newButtonText="Add Stakeholder"
      />

      <main className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-blue-500" />
            <div><p className="text-2xl font-bold">{stakeholders.length}</p><p className="text-sm text-gray-500">Total</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Star className="h-8 w-8 text-green-500" />
            <div><p className="text-2xl font-bold">{champions}</p><p className="text-sm text-gray-500">Champions / Supporters</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div><p className="text-2xl font-bold">{opponents}</p><p className="text-sm text-gray-500">Need Attention</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-500" />
            <div><p className="text-2xl font-bold">{needsFollowUp}</p><p className="text-sm text-gray-500">Follow-ups Due</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <Label className="text-sm text-gray-600">Filter by Program:</Label>
          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stakeholder List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading stakeholders...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No stakeholders yet</p>
              <p className="text-sm text-gray-400">Add stakeholders to track relationships and engagement actions</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">Add Stakeholder</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(stakeholder => {
              const isEditing = editingId === stakeholder.id;
              const linkedProgram = programs.find(p => p.id === stakeholder.programId);
              return (
              <Card key={stakeholder.id} className="border border-gray-200/80 bg-white shadow-sm">
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedId(expandedId === stakeholder.id ? null : stakeholder.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedId === stakeholder.id
                          ? <ChevronDown className="h-5 w-5" />
                          : <ChevronRight className="h-5 w-5" />}
                      </button>
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700 text-sm">
                        {(isEditing ? editValues.name : stakeholder.name).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <Input
                              value={editValues.name}
                              onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                              className="h-7 text-sm font-semibold"
                              autoFocus
                            />
                            <Input
                              value={editValues.role}
                              onChange={(e) => setEditValues(prev => ({ ...prev, role: e.target.value }))}
                              className="h-7 text-xs"
                              placeholder="Role / Title"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900">{stakeholder.name}</p>
                            <p className="text-xs text-gray-500">
                              {stakeholder.role}{stakeholder.department ? ` · ${stakeholder.department}` : ""}
                              {linkedProgram && (
                                <>
                                  {" · "}
                                  <button
                                    className="text-primary-600 hover:text-primary-700 hover:underline"
                                    onClick={(e) => { e.stopPropagation(); setLocation(`/programs/${linkedProgram.id}`); }}
                                  >
                                    {linkedProgram.name}
                                  </button>
                                </>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stakeholder.influenceLevel && (
                        <Badge variant="outline" className="text-xs">
                          Influence: {INFLUENCE_LABELS[stakeholder.influenceLevel] ?? stakeholder.influenceLevel}
                        </Badge>
                      )}
                      {stakeholder.supportLevel && (
                        <Badge className={`text-xs ${SUPPORT_COLORS[stakeholder.supportLevel] ?? "bg-gray-100 text-gray-700"}`}>
                          {SUPPORT_LABELS[stakeholder.supportLevel] ?? "Unknown"}
                        </Badge>
                      )}
                      {isEditing ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => saveEditingStakeholder(stakeholder.id)} disabled={updateMutation.isPending}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditingStakeholder}>
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEditingStakeholder(stakeholder)}>
                          <Pencil className="h-4 w-4 text-gray-400" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedStakeholder(stakeholder); setExpandedId(stakeholder.id); setShowInteractionModal(true); }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Log Step
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(stakeholder.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: interaction history */}
                  {expandedId === stakeholder.id && (
                    <div className="mt-4 ml-8 space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                        {stakeholder.leadershipStyle && <span><strong>Leadership:</strong> {stakeholder.leadershipStyle}</span>}
                        {stakeholder.communicationStyle && <span><strong>Comms:</strong> {stakeholder.communicationStyle}</span>}
                        {stakeholder.decisionMakingStyle && <span><strong>Decisions:</strong> {stakeholder.decisionMakingStyle}</span>}
                      </div>
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" /> Engagement Log
                        </p>
                        {interactions.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No steps logged yet. Click "Log Step" to record actions taken or planned.</p>
                        ) : (
                          <div className="space-y-2">
                            {interactions.map(interaction => (
                              <div key={interaction.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <CheckCircle className="h-3 w-3 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-800">{interaction.interactionType}</span>
                                    <span className="text-xs text-gray-400">
                                      {interaction.createdAt ? new Date(interaction.createdAt).toLocaleDateString() : ""}
                                    </span>
                                  </div>
                                  {interaction.context && <p className="text-gray-600 mb-1">{interaction.context}</p>}
                                  {interaction.actualResponse && (
                                    <p className="text-gray-500 text-xs italic">Response: {interaction.actualResponse}</p>
                                  )}
                                  {Array.isArray(interaction.recommendations) && interaction.recommendations.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-orange-600 mb-1">Planned Actions:</p>
                                      {(interaction.recommendations as string[]).map((r, i) => (
                                        <div key={i} className="flex items-center gap-1 text-xs text-orange-700">
                                          <Clock className="h-3 w-3" />{r}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {interaction.followUpRequired && interaction.followUpDate && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                                      <Calendar className="h-3 w-3" />
                                      Follow-up: {new Date(interaction.followUpDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Stakeholder Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Stakeholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={stakeholderForm.name} onChange={e => setStakeholderForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={stakeholderForm.email} onChange={e => setStakeholderForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role / Title</Label>
                <Input value={stakeholderForm.role} onChange={e => setStakeholderForm(p => ({ ...p, role: e.target.value }))} placeholder="VP Engineering" />
              </div>
              <div>
                <Label>Department</Label>
                <Input value={stakeholderForm.department} onChange={e => setStakeholderForm(p => ({ ...p, department: e.target.value }))} placeholder="Engineering" />
              </div>
            </div>
            <div>
              <Label>Program (optional)</Label>
              <Select value={stakeholderForm.programId} onValueChange={v => setStakeholderForm(p => ({ ...p, programId: v }))}>
                <SelectTrigger><SelectValue placeholder="Not linked to a program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not linked</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Leadership Style</Label>
                <Select value={stakeholderForm.leadershipStyle} onValueChange={v => setStakeholderForm(p => ({ ...p, leadershipStyle: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Autocratic", "Democratic", "Laissez-faire", "Transformational", "Transactional"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Communication Style</Label>
                <Select value={stakeholderForm.communicationStyle} onValueChange={v => setStakeholderForm(p => ({ ...p, communicationStyle: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Direct", "Analytical", "Expressive", "Amiable"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Decision Making</Label>
                <Select value={stakeholderForm.decisionMakingStyle} onValueChange={v => setStakeholderForm(p => ({ ...p, decisionMakingStyle: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Data-driven", "Intuitive", "Consensus-seeking", "Quick"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Influence Level (1–5)</Label>
                <Select value={String(stakeholderForm.influenceLevel)} onValueChange={v => setStakeholderForm(p => ({ ...p, influenceLevel: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} – {INFLUENCE_LABELS[n]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Support Level (1–5)</Label>
                <Select value={String(stakeholderForm.supportLevel)} onValueChange={v => setStakeholderForm(p => ({ ...p, supportLevel: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} – {SUPPORT_LABELS[n]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateStakeholder} disabled={!stakeholderForm.name || createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Stakeholder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Interaction / Step Modal */}
      <Dialog open={showInteractionModal} onOpenChange={setShowInteractionModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Engagement Step — {selectedStakeholder?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={interactionForm.interactionType} onValueChange={v => setInteractionForm(p => ({ ...p, interactionType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Meeting", "Email", "Call", "Decision", "Presentation", "Workshop", "Escalation", "Other"].map(t =>
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Step Taken / What Happened</Label>
              <Textarea
                value={interactionForm.context}
                onChange={e => setInteractionForm(p => ({ ...p, context: e.target.value }))}
                placeholder="Describe the action taken, topic discussed, decision made..."
                rows={3}
              />
            </div>
            <div>
              <Label>Stakeholder Response (optional)</Label>
              <Textarea
                value={interactionForm.actualResponse}
                onChange={e => setInteractionForm(p => ({ ...p, actualResponse: e.target.value }))}
                placeholder="How did the stakeholder respond? Any concerns or feedback?"
                rows={2}
              />
            </div>
            <div>
              <Label>Planned Next Step (optional)</Label>
              <Input
                value={interactionForm.plannedStep}
                onChange={e => setInteractionForm(p => ({ ...p, plannedStep: e.target.value }))}
                placeholder="e.g. Schedule follow-up demo, Send summary email..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="followUp"
                checked={interactionForm.followUpRequired}
                onCheckedChange={c => setInteractionForm(p => ({ ...p, followUpRequired: !!c }))}
              />
              <Label htmlFor="followUp" className="cursor-pointer">Follow-up required</Label>
              {interactionForm.followUpRequired && (
                <Input
                  type="date"
                  value={interactionForm.followUpDate}
                  onChange={e => setInteractionForm(p => ({ ...p, followUpDate: e.target.value }))}
                  className="ml-auto w-40"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowInteractionModal(false)}>Cancel</Button>
              <Button onClick={handleAddInteraction} disabled={!interactionForm.context || addInteractionMutation.isPending}>
                {addInteractionMutation.isPending ? "Logging..." : "Log Step"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
