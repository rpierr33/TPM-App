import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ChartGantt, 
  AlertTriangle, 
  Flag, 
  Users,
  GitBranch,
  Calendar,
  ArrowRight,
  Eye,
  Clock,
  CheckCircle
} from "lucide-react";
import type { Program, Risk, Milestone, Adopter, Dependency } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();

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

  const activePendingPrograms = programs.filter(p => p.status === 'active' || p.status === 'planning');
  const completedPrograms = programs.filter(p => p.status === 'completed');
  const onHoldPrograms = programs.filter(p => p.status === 'on_hold');

  const handleNewProgram = () => {
    setLocation("/program-planning");
  };

  const getProgramRisks = (programId: string) => {
    return risks.filter(r => r.programId === programId);
  };

  const getProgramMilestones = (programId: string) => {
    return milestones.filter(m => m.programId === programId);
  };

  const getProgramAdopters = (programId: string) => {
    return adopters.filter(a => a.programId === programId);
  };

  const getProgramDependencies = (programId: string) => {
    return dependencies.filter(d => d.programId === programId);
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

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'planning': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <Flag className="h-4 w-4 text-gray-600" />;
      default: return <ChartGantt className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Program Dashboard"
        subtitle="Overview of all active programs and initiatives"
        onNewClick={handleNewProgram}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Active Programs"
            value={activePendingPrograms.length}
            change={`${programs.length} total`}
            changeType="neutral"
            icon={ChartGantt}
            iconColor="bg-primary-100"
            navigateTo="/programs"
          />
          <MetricsCard
            title="All Risks"
            value={risks.length}
            change="across all programs"
            changeType="neutral"
            icon={AlertTriangle}
            iconColor="bg-red-100"
            navigateTo="/risk-management"
          />
          <MetricsCard
            title="All Milestones"
            value={milestones.length}
            change="across all programs"
            changeType="neutral"
            icon={Flag}
            iconColor="bg-yellow-100"
            navigateTo="/milestones"
          />
          <MetricsCard
            title="All Teams"
            value={adopters.length}
            change="being tracked"
            changeType="neutral"
            icon={Users}
            iconColor="bg-blue-100"
            navigateTo="/adopter-support"
          />
        </div>

        {/* Active/Pending Programs - Main Focus */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Active & Planning Programs</h2>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/programs")}
              className="text-primary-600 border-primary-200 hover:bg-primary-50"
            >
              View All Programs <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {programsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
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
          ) : activePendingPrograms.length === 0 ? (
            <Card className="border border-gray-200">
              <CardContent className="p-12 text-center">
                <ChartGantt size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active programs</h3>
                <p className="text-gray-500 mb-4">Create your first program to start tracking progress and managing initiatives.</p>
                <Button onClick={handleNewProgram} className="bg-primary-500 text-white hover:bg-primary-600">
                  Create First Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activePendingPrograms.map((program) => {
                const programRisks = getProgramRisks(program.id);
                const programMilestones = getProgramMilestones(program.id);
                const programAdopters = getProgramAdopters(program.id);
                const programDependencies = getProgramDependencies(program.id);
                
                const criticalRisks = programRisks.filter(r => r.severity === 'critical' || r.severity === 'high');
                const overdueMilestones = programMilestones.filter(m => 
                  m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed'
                );
                const blockedDependencies = programDependencies.filter(d => d.status === 'blocked');

                return (
                  <Card key={program.id} className="border border-gray-200 hover:border-primary-300 transition-colors">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(program.status)}
                            <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                            <Badge className={getStatusColor(program.status)}>
                              {program.status?.replace('_', ' ') || 'active'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Owner: {program.owner || 'Unassigned'}</span>
                            {program.startDate && (
                              <span>Started: {new Date(program.startDate).toLocaleDateString()}</span>
                            )}
                            {program.endDate && (
                              <span>Due: {new Date(program.endDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Program Components Summary */}
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">{programRisks.length}</span>
                          </div>
                          <div className="text-xs text-gray-500">Risks</div>
                          {criticalRisks.length > 0 && (
                            <div className="text-xs text-red-600 font-medium">{criticalRisks.length} critical</div>
                          )}
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Flag className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">{programMilestones.length}</span>
                          </div>
                          <div className="text-xs text-gray-500">Milestones</div>
                          {overdueMilestones.length > 0 && (
                            <div className="text-xs text-red-600 font-medium">{overdueMilestones.length} overdue</div>
                          )}
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Users className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">{programAdopters.length}</span>
                          </div>
                          <div className="text-xs text-gray-500">Teams</div>
                        </div>

                        <div className="text-center">
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
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex gap-2">
                          {criticalRisks.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setLocation(`/risk-management?programId=${program.id}`)}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              View Critical Risks
                            </Button>
                          )}
                          {overdueMilestones.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              onClick={() => setLocation(`/milestones?programId=${program.id}`)}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              View Overdue Items
                            </Button>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setLocation(`/programs`)}
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
        </div>

        {/* Other Programs Summary */}
        {(completedPrograms.length > 0 || onHoldPrograms.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Other Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedPrograms.length > 0 && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Completed Programs ({completedPrograms.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {completedPrograms.slice(0, 3).map(program => (
                        <div key={program.id} className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700">{program.name}</span>
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        </div>
                      ))}
                      {completedPrograms.length > 3 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setLocation("/programs")}
                          className="w-full text-primary-600"
                        >
                          View All Completed ({completedPrograms.length - 3} more)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {onHoldPrograms.length > 0 && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      On Hold Programs ({onHoldPrograms.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {onHoldPrograms.slice(0, 3).map(program => (
                        <div key={program.id} className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700">{program.name}</span>
                          <Badge className="bg-yellow-100 text-yellow-800">On Hold</Badge>
                        </div>
                      ))}
                      {onHoldPrograms.length > 3 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setLocation("/programs")}
                          className="w-full text-primary-600"
                        >
                          View All On Hold ({onHoldPrograms.length - 3} more)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Quick Navigation to Components */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/risk-management")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">All Risks</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setLocation("/milestones")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
          >
            <Flag className="h-5 w-5" />
            <span className="text-sm">All Milestones</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setLocation("/dependencies")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <GitBranch className="h-5 w-5" />
            <span className="text-sm">Dependencies</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setLocation("/adopter-support")}
            className="h-16 flex flex-col items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm">Team Adoption</span>
          </Button>
        </div>
      </main>
    </div>
  );
}