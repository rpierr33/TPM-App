import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { PMPRecommendationsPanel } from "@/components/pmp/PMPRecommendationsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ChartGantt,
  AlertTriangle,
  Flag,
  Users,
  GitBranch,
  Eye,
  Search,
  Filter,
  Plus,
  Pencil,
  Check,
  X
} from "lucide-react";
import { calculateProgramHealth, getHealthBadge } from "@/lib/healthCalculation";
import { getMissingComponents as getMissingComponentsUtil } from "@/lib/missingComponents";
import type { Program, Risk, Milestone, Adopter, Dependency } from "@shared/schema";

export default function Programs() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Renamed", description: "Program name updated" });
      setEditingId(null);
      queryClient.refetchQueries({ queryKey: ["/api/programs"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to rename", variant: "destructive" });
      setEditingId(null);
    },
  });

  // Get filter from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');

  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: risks = [] } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones"],
  });

  const { data: adopters = [] } = useQuery<Adopter[]>({
    queryKey: ["/api/adopters"],
  });

  const { data: dependencies = [] } = useQuery<Dependency[]>({
    queryKey: ["/api/dependencies"],
  });

  // Helper functions to get program-specific data
  const getProgramRisks = (programId: string) => 
    risks.filter(risk => risk.programId === programId);

  const getProgramMilestones = (programId: string) => 
    milestones.filter(milestone => milestone.programId === programId);

  const getProgramAdopters = (programId: string) => 
    adopters.filter(adopter => adopter.programId === programId);

  const getProgramDependencies = (programId: string) => 
    dependencies.filter(dep => dep.programId === programId);

  // Filter programs based on URL filter parameter and local filters
  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatusFilter = true;
    
    // URL filter takes precedence over local filter
    if (filterParam === 'active') {
      matchesStatusFilter = program.status === 'active' || program.status === 'planning';
    } else if (filterParam === 'on_hold') {
      matchesStatusFilter = program.status === 'on_hold';
    } else if (filterParam === 'completed') {
      matchesStatusFilter = program.status === 'completed';
    } else if (statusFilter !== 'all') {
      // Only apply local filter if no URL filter is present
      matchesStatusFilter = program.status === statusFilter;
    }
    // If no filters, show all programs (when filterParam is null and statusFilter is 'all')

    return matchesSearch && matchesStatusFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return <ChartGantt className="h-4 w-4 text-green-600" />;
      case 'planning': return <Flag className="h-4 w-4 text-blue-600" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <Flag className="h-4 w-4 text-gray-600" />;
      default: return <ChartGantt className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilterTitle = () => {
    if (filterParam === 'active') return 'Active Programs';
    if (filterParam === 'on_hold') return 'Programs on Hold';
    if (filterParam === 'completed') return 'Completed Programs';
    return 'All Programs';
  };

  const getFilterSubtitle = () => {
    if (filterParam === 'active') return `Active and planning programs (${filteredPrograms.length} programs)`;
    if (filterParam === 'on_hold') return `Programs currently on hold (${filteredPrograms.length} programs)`;
    if (filterParam === 'completed') return `Completed programs (${filteredPrograms.length} programs)`;
    return `Manage and track all your programs (${filteredPrograms.length} programs)`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title={getFilterTitle()}
        subtitle={getFilterSubtitle()}
        onNewClick={() => setLocation("/")}
        newButtonText="New Program"
      />

      <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>

          </div>

          {filterParam && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>Showing: {filterParam.replace('_', ' ')} programs only</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/programs")}
                className="text-primary-600 hover:text-primary-700"
              >
                Show all programs
              </Button>
            </div>
          )}
        </div>

        {/* Programs Grid */}
        {programsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-12 text-center">
              <ChartGantt size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' ? 
                  'Try adjusting your search or filter criteria.' : 
                  'Create your first program to start tracking progress and managing initiatives.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setLocation("/")} className="bg-primary-500 text-white hover:bg-primary-600">
                  Create First Program
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => {
              const programRisks = getProgramRisks(program.id);
              const programMilestones = getProgramMilestones(program.id);
              const programAdopters = getProgramAdopters(program.id);
              const programDependencies = getProgramDependencies(program.id);
              
              const criticalRisks = programRisks.filter(r => r.severity === 'critical' || r.severity === 'high');
              const overdueMilestones = programMilestones.filter(m => 
                m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed'
              );
              const blockedDependencies = programDependencies.filter(d => d.status === 'blocked');

              const missingComponentsList = getMissingComponentsUtil(program, {
                risks: programRisks.length,
                milestones: programMilestones.length,
                adopters: programAdopters.length,
              });
              const missingComponents = missingComponentsList.map(c => c.label);

              // Calculate program health using centralized utility
              const healthMetrics = calculateProgramHealth({
                risks: programRisks,
                milestones: programMilestones,
                dependencies: programDependencies,
                missingComponents: missingComponents.length
              });

              const healthBadge = getHealthBadge(healthMetrics.score);

              return (
                <Card
                  key={program.id}
                  className="border border-gray-200/80 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => setLocation(`/programs/${program.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getStatusIcon(program.status || 'active')}
                        {editingId === program.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && editName.trim()) renameMutation.mutate({ id: program.id, name: editName.trim() }); if (e.key === 'Escape') setEditingId(null); }}
                              autoFocus className="h-7 text-sm font-semibold w-40" />
                            <button onClick={() => editName.trim() && renameMutation.mutate({ id: program.id, name: editName.trim() })} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{program.name}</h3>
                            <button onClick={(e) => { e.stopPropagation(); setEditingId(program.id); setEditName(program.name); }}
                              className="p-0.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" title="Rename">
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <Badge className={`${getStatusColor(program.status || 'active')} text-[10px] flex-shrink-0`}>
                          {program.status?.replace('_', ' ') || 'active'}
                        </Badge>
                      </div>
                      <Badge className={`${healthBadge.color} text-[10px] flex-shrink-0 ml-2`}>{healthBadge.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className={`h-3 w-3 ${criticalRisks.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={criticalRisks.length > 0 ? 'text-red-600 font-medium' : ''}>{programRisks.length} risks</span>
                        {criticalRisks.length > 0 && <span className="text-red-500">({criticalRisks.length} critical)</span>}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1">
                        <Flag className={`h-3 w-3 ${overdueMilestones.length > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                        <span>{programMilestones.length} milestones</span>
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1">
                        <GitBranch className={`h-3 w-3 ${blockedDependencies.length > 0 ? 'text-purple-500' : 'text-gray-400'}`} />
                        <span>{programDependencies.length} deps</span>
                      </span>
                    </div>
                    {(criticalRisks.length > 0 || overdueMilestones.length > 0) && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                        <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        <span className="text-amber-600 truncate">
                          {[criticalRisks.length > 0 && `${criticalRisks.length} critical risks`, overdueMilestones.length > 0 && `${overdueMilestones.length} overdue`].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* PMP Recommendations - always visible */}
        <div className="mt-6">
          <PMPRecommendationsPanel />
        </div>
      </main>
    </div>
  );
}