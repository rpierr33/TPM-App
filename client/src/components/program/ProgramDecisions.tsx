import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus,
  FileText,
  Calendar,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  User,
} from "lucide-react";

interface Decision {
  id: string;
  title: string;
  description: string | null;
  programId: string | null;
  decidedBy: string | null;
  rationale: string | null;
  impact: string | null;
  status: "proposed" | "approved" | "rejected" | "deferred" | null;
  decisionDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ProgramDecisionsProps {
  programId: string;
}

export function ProgramDecisions({ programId }: ProgramDecisionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDecision, setNewDecision] = useState({
    title: "", description: "", rationale: "", impact: "", decidedBy: "", status: "proposed", decisionDate: "",
  });

  const { data: allDecisions = [] } = useQuery<Decision[]>({
    queryKey: ["/api/decisions"],
  });

  const programDecisions = allDecisions
    .filter(d => d.programId === programId)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/decisions", "POST", data),
    onSuccess: () => {
      toast({ title: "Decision recorded" });
      setShowAddModal(false);
      setNewDecision({ title: "", description: "", rationale: "", impact: "", decidedBy: "", status: "proposed", decisionDate: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/decisions"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to record decision", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => apiRequest(`/api/decisions/${id}`, "PATCH", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/decisions"] }),
    onError: () => toast({ title: "Error", description: "Failed to update decision", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/decisions/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Decision deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/decisions"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete decision", variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecision.title.trim()) return;
    createMutation.mutate({
      title: newDecision.title.trim(),
      description: newDecision.description.trim() || null,
      rationale: newDecision.rationale.trim() || null,
      impact: newDecision.impact.trim() || null,
      decidedBy: newDecision.decidedBy.trim() || null,
      programId,
      status: newDecision.status,
      decisionDate: newDecision.decisionDate || null,
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 text-[10px]"><CheckCircle className="h-2.5 w-2.5 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 text-[10px]"><XCircle className="h-2.5 w-2.5 mr-1" />Rejected</Badge>;
      case 'deferred': return <Badge className="bg-amber-100 text-amber-700 text-[10px]"><Pause className="h-2.5 w-2.5 mr-1" />Deferred</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 text-[10px]"><Clock className="h-2.5 w-2.5 mr-1" />Proposed</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{programDecisions.length} decision{programDecisions.length !== 1 ? 's' : ''} recorded</p>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="text-xs bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-3 w-3 mr-1.5" />
          Record Decision
        </Button>
      </div>

      {/* Decision List */}
      {programDecisions.length === 0 ? (
        <Card className="border border-gray-200">
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">No decisions recorded yet</p>
            <p className="text-xs text-gray-400 mb-4">Track key decisions, rationale, and outcomes for this program</p>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-3 w-3 mr-1.5" />
              Record first decision
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {programDecisions.map((decision) => (
            <Card key={decision.id} className="border border-gray-200/80 shadow-sm bg-white group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">{decision.title}</h4>
                      {getStatusBadge(decision.status)}
                    </div>

                    {decision.description && (
                      <p className="text-[12px] text-gray-600 mb-2">{decision.description}</p>
                    )}

                    {decision.rationale && (
                      <div className="mb-2 pl-3 border-l-2 border-blue-200">
                        <p className="text-[11px] text-gray-500">
                          <span className="font-semibold text-gray-600">Rationale:</span> {decision.rationale}
                        </p>
                      </div>
                    )}

                    {decision.impact && (
                      <div className="mb-2 pl-3 border-l-2 border-amber-200">
                        <p className="text-[11px] text-gray-500">
                          <span className="font-semibold text-gray-600">Impact:</span> {decision.impact}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-2">
                      {decision.decidedBy && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {decision.decidedBy}
                        </span>
                      )}
                      {decision.decisionDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(decision.decisionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {decision.createdAt && (
                        <span>
                          Recorded {new Date(decision.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <select
                      value={decision.status || 'proposed'}
                      onChange={(e) => updateMutation.mutate({ id: decision.id, status: e.target.value })}
                      className="text-[10px] border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <option value="proposed">Proposed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="deferred">Deferred</option>
                    </select>
                    <button
                      onClick={() => deleteMutation.mutate(decision.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Decision Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Decision</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Decision Title</Label>
              <Input
                value={newDecision.title}
                onChange={(e) => setNewDecision(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What was decided?"
                required
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={newDecision.description}
                onChange={(e) => setNewDecision(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Context and details..."
                rows={2}
              />
            </div>
            <div>
              <Label>Rationale</Label>
              <Textarea
                value={newDecision.rationale}
                onChange={(e) => setNewDecision(prev => ({ ...prev, rationale: e.target.value }))}
                placeholder="Why was this decision made?"
                rows={2}
              />
            </div>
            <div>
              <Label>Impact (optional)</Label>
              <Textarea
                value={newDecision.impact}
                onChange={(e) => setNewDecision(prev => ({ ...prev, impact: e.target.value }))}
                placeholder="What does this affect?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Decided By</Label>
                <Input
                  value={newDecision.decidedBy}
                  onChange={(e) => setNewDecision(prev => ({ ...prev, decidedBy: e.target.value }))}
                  placeholder="Name"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={newDecision.status} onValueChange={(v) => setNewDecision(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newDecision.decisionDate}
                  onChange={(e) => setNewDecision(prev => ({ ...prev, decisionDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Recording..." : "Record Decision"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
