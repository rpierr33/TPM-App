import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  ChartGantt, 
  AlertTriangle, 
  Flag, 
  Users,
  GitBranch,
  Eye,
  Search,
  Filter,
  Plus
} from "lucide-react";
import type { Program, Risk, Milestone, Adopter, Dependency } from "@shared/schema";

export default function Programs() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title={getFilterTitle()}
        subtitle={getFilterSubtitle()}
        onNewClick={() => setLocation("/dashboard")}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
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
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <Button onClick={() => setLocation("/dashboard")} className="bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              New Program
            </Button>
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
                <Button onClick={() => setLocation("/dashboard")} className="bg-primary-500 text-white hover:bg-primary-600">
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

              // Check for missing essential components
              const getMissingComponents = () => {
                const missing = [];
                if (!program.description || program.description.trim().length < 10) missing.push('Description');
                if (!program.ownerId) missing.push('Owner');
                if (!program.startDate) missing.push('Start Date');
                if (!program.endDate) missing.push('End Date');
                if (!program.objectives || (Array.isArray(program.objectives) && !program.objectives.length)) missing.push('Objectives');
                if (!program.kpis || (Array.isArray(program.kpis) && !program.kpis.length)) missing.push('KPIs');
                if (programMilestones.length === 0) missing.push('Milestones');
                if (programAdopters.length === 0) missing.push('Adopter Teams');
                return missing;
              };

              const missingComponents = getMissingComponents();
              const totalMissingRisks = missingComponents.length;

              // Calculate program health score (including missing components)
              const getHealthScore = () => {
                let score = 100;
                score -= criticalRisks.length * 15;
                score -= overdueMilestones.length * 10;
                score -= blockedDependencies.length * 5;
                score -= totalMissingRisks * 8; // Missing components are significant risks
                return Math.max(0, score);
              };

              const getHealthBadge = (score: number) => {
                if (score >= 80) return { label: "Excellent", color: "bg-green-100 text-green-800" };
                if (score >= 60) return { label: "Good", color: "bg-blue-100 text-blue-800" };
                if (score >= 40) return { label: "Fair", color: "bg-yellow-100 text-yellow-800" };
                return { label: "At Risk", color: "bg-red-100 text-red-800" };
              };

              const healthScore = getHealthScore();
              const healthBadge = getHealthBadge(healthScore);

              return (
                <Card key={program.id} className="border border-gray-200 hover:border-primary-300 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(program.status || 'active')}
                          <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                          <Badge className={getStatusColor(program.status || 'active')}>
                            {program.status?.replace('_', ' ') || 'active'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Owner: {program.ownerId || 'Unassigned'}</span>
                          {program.startDate && (
                            <span>Started: {new Date(program.startDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Health</div>
                        <Badge className={healthBadge.color}>
                          {healthBadge.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Program Components Summary */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-2 rounded bg-gray-50">
                        <div className="flex items-center justify-center mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-lg font-semibold text-gray-900">{programRisks.length + totalMissingRisks}</span>
                        </div>
                        <div className="text-xs text-gray-500">Total Risks</div>
                        {(criticalRisks.length > 0 || totalMissingRisks > 0) && (
                          <div className="text-xs text-red-600 font-medium">
                            {criticalRisks.length > 0 && `${criticalRisks.length} critical`}
                            {criticalRisks.length > 0 && totalMissingRisks > 0 && ', '}
                            {totalMissingRisks > 0 && `${totalMissingRisks} missing`}
                          </div>
                        )}
                      </div>

                      <div className="text-center p-2 rounded bg-gray-50">
                        <div className="flex items-center justify-center mb-1">
                          <Flag className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-lg font-semibold text-gray-900">{programMilestones.length}</span>
                        </div>
                        <div className="text-xs text-gray-500">Milestones</div>
                        {overdueMilestones.length > 0 && (
                          <div className="text-xs text-red-600 font-medium">{overdueMilestones.length} overdue</div>
                        )}
                      </div>

                      <div className="text-center p-2 rounded bg-gray-50">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-lg font-semibold text-gray-900">{programAdopters.length}</span>
                        </div>
                        <div className="text-xs text-gray-500">Teams</div>
                      </div>

                      <div className="text-center p-2 rounded bg-gray-50">
                        <div className="flex items-center justify-center mb-1">
                          <GitBranch className="h-4 w-4 text-purple-500 mr-1" />
                          <span className="text-lg font-semibold text-gray-900">{programDependencies.length}</span>
                        </div>
                        <div className="text-xs text-gray-500">Dependencies</div>
                        {blockedDependencies.length > 0 && (
                          <div className="text-xs text-red-600 font-medium">{blockedDependencies.length} blocked</div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setLocation(`/programs/${program.id}`)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}