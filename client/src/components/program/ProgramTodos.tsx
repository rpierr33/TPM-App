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
  Sparkles,
  CheckCircle,
  Circle,
  Clock,
  Trash2,
  Calendar,
  ArrowUpDown,
  X as XIcon,
} from "lucide-react";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  programId: string | null;
  ownerId: string | null;
  status: "not_started" | "in_progress" | "completed" | "cancelled" | null;
  source: "manual" | "pmp_recommendation" | "ai_generated" | null;
  priority: number | null;
  dueDate: string | null;
  completedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ProgramTodosProps {
  programId: string;
}

export function ProgramTodos({ programId }: ProgramTodosProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: "", description: "", priority: "3", dueDate: "" });

  const { data: allTodos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const programTodos = allTodos.filter(t => t.programId === programId);

  const filteredTodos = programTodos.filter(t => {
    if (filter === 'active') return t.status !== 'completed' && t.status !== 'cancelled';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  }).sort((a, b) => {
    // Completed last, then by priority desc, then by due date
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    const aPri = a.priority ?? 1;
    const bPri = b.priority ?? 1;
    if (bPri !== aPri) return bPri - aPri;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return 0;
  });

  const activeCount = programTodos.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
  const completedCount = programTodos.filter(t => t.status === 'completed').length;

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/todos", "POST", data),
    onSuccess: () => {
      toast({ title: "Todo added" });
      setShowAddModal(false);
      setNewTodo({ title: "", description: "", priority: "3", dueDate: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to add todo", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => apiRequest(`/api/todos/${id}`, "PATCH", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/todos"] }),
    onError: () => toast({ title: "Error", description: "Failed to update todo", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/todos/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Todo deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete todo", variant: "destructive" }),
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest(`/api/todos/generate/${programId}`, "POST"),
    onSuccess: (data: any) => {
      toast({ title: "Todos generated", description: `${data.generated} new todos from PMP analysis` });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to generate todos", variant: "destructive" }),
  });

  const toggleStatus = (todo: Todo) => {
    const nextStatus = todo.status === 'completed' ? 'not_started' : 'completed';
    updateMutation.mutate({
      id: todo.id,
      status: nextStatus,
      completedDate: nextStatus === 'completed' ? new Date().toISOString() : null,
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    createMutation.mutate({
      title: newTodo.title.trim(),
      description: newTodo.description.trim() || null,
      programId,
      priority: parseInt(newTodo.priority),
      dueDate: newTodo.dueDate || null,
      source: "manual",
      status: "not_started",
    });
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <XIcon className="h-4 w-4 text-gray-400" />;
      default: return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  const getPriorityBadge = (priority: number | null) => {
    const p = priority ?? 1;
    if (p >= 5) return <Badge className="bg-red-100 text-red-700 text-[10px]">Critical</Badge>;
    if (p >= 4) return <Badge className="bg-amber-100 text-amber-700 text-[10px]">High</Badge>;
    if (p >= 3) return <Badge className="bg-blue-100 text-blue-700 text-[10px]">Medium</Badge>;
    return <Badge className="bg-gray-100 text-gray-600 text-[10px]">Low</Badge>;
  };

  const getSourceBadge = (source: string | null) => {
    if (source === 'pmp_recommendation') return <Badge className="bg-purple-50 text-purple-600 text-[10px]">PMP</Badge>;
    if (source === 'ai_generated') return <Badge className="bg-blue-50 text-blue-600 text-[10px]">AI</Badge>;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{activeCount} active</span>
            <span className="text-gray-300">&middot;</span>
            <span className="text-gray-500">{completedCount} done</span>
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1.5" />
            {generateMutation.isPending ? "Generating..." : "Generate from PMP"}
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="text-xs bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="h-3 w-3 mr-1.5" />
            Add Todo
          </Button>
        </div>
      </div>

      {/* Todo List */}
      {filteredTodos.length === 0 ? (
        <Card className="border border-gray-200">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">
              {filter === 'completed' ? 'No completed todos yet' : 'No todos yet for this program'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                <Sparkles className="h-3 w-3 mr-1.5" />
                Auto-generate from PMP
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-3 w-3 mr-1.5" />
                Add manually
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200/80 shadow-sm bg-white">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${
                    todo.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleStatus(todo)}
                    className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                  >
                    {getStatusIcon(todo.status)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-medium ${todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {todo.title}
                      </p>
                      {getPriorityBadge(todo.priority)}
                      {getSourceBadge(todo.source)}
                    </div>
                    {todo.description && (
                      <p className="text-[11px] text-gray-400 truncate">{todo.description}</p>
                    )}
                    {todo.dueDate && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className={`text-[10px] ${
                          new Date(todo.dueDate) < new Date() && todo.status !== 'completed'
                            ? 'text-red-500 font-medium'
                            : 'text-gray-400'
                        }`}>
                          {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status quick-change */}
                  <select
                    value={todo.status || 'not_started'}
                    onChange={(e) => updateMutation.mutate({ id: todo.id, status: e.target.value })}
                    className="text-[10px] border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => deleteMutation.mutate(todo.id)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Todo Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Todo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newTodo.title}
                onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What needs to be done?"
                required
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={newTodo.description}
                onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={newTodo.priority} onValueChange={(v) => setNewTodo(prev => ({ ...prev, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Critical</SelectItem>
                    <SelectItem value="4">High</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="2">Low</SelectItem>
                    <SelectItem value="1">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date (optional)</Label>
                <Input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Todo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
