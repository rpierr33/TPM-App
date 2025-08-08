import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartGantt, 
  Plus,
  Calendar,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Pause,
  Eye
} from "lucide-react";
import type { Program } from "@shared/schema";

export default function Programs() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const analyzeProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      return await apiRequest("/api/analyze-program", "POST", { programId });
    },
    onSuccess: (data: any, programId: string) => {
      const program = programs.find(p => p.id === programId);
      const analysis = data.analysis?.[0];
      if (analysis) {
        toast({
          title: `${program?.name} Analysis Complete`,
          description: `Found ${analysis.riskAlerts?.length || 0} missing components. Completeness: ${analysis.completenessScore}%`,
          variant: analysis.riskAlerts?.length > 0 ? "destructive" : "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze program at this time",
        variant: "destructive"
      });
    }
  });

  const handleNewProgram = () => {
    console.log("Create new program");
  };

  const handleCheckRisks = (programId: string) => {
    analyzeProgramMutation.mutate(programId);
  };

  const handleViewDetails = (programId: string) => {
    // Navigate to program details page
    setLocation(`/program-planning?programId=${programId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "planning": return <Clock className="h-4 w-4 text-blue-600" />;
      case "on-hold": return <Pause className="h-4 w-4 text-yellow-600" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default: return <ChartGantt className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "planning": return "bg-blue-100 text-blue-800 border-blue-200";
      case "on-hold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return "Not set";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const filteredPrograms = programs.filter(program => 
    selectedStatus === "all" || program.status === selectedStatus
  );

  const statusCounts = programs.reduce((acc, program) => {
    const status = program.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Programs"
          subtitle="Manage all your programs and initiatives"
          onNewClick={handleNewProgram}
        />
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Programs"
        subtitle={`${programs.length} total programs across all statuses`}
        onNewClick={handleNewProgram}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedStatus === 'active' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('active')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Programs</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.active || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedStatus === 'planning' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('planning')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planning</p>
                  <p className="text-2xl font-bold text-blue-600">{statusCounts.planning || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedStatus === 'on-hold' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('on-hold')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Hold</p>
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts['on-hold'] || 0}</p>
                </div>
                <Pause className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedStatus === 'completed' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('completed')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-600">{statusCounts.completed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              All Programs ({programs.length})
            </Button>
            <Button
              variant={selectedStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('active')}
            >
              Active ({statusCounts.active || 0})
            </Button>
            <Button
              variant={selectedStatus === 'planning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('planning')}
            >
              Planning ({statusCounts.planning || 0})
            </Button>
            <Button
              variant={selectedStatus === 'on-hold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('on-hold')}
            >
              On Hold ({statusCounts['on-hold'] || 0})
            </Button>
            <Button
              variant={selectedStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('completed')}
            >
              Completed ({statusCounts.completed || 0})
            </Button>
          </div>
        </div>

        {/* Programs List */}
        <div className="space-y-4">
          {filteredPrograms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ChartGantt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedStatus === 'all' ? 'No programs found' : `No ${selectedStatus} programs`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedStatus === 'all' 
                    ? 'Create your first program to get started'
                    : `No programs with ${selectedStatus} status exist yet`
                  }
                </p>
                <Button onClick={handleNewProgram}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(program.status)}
                        <h3 className="text-xl font-semibold text-gray-900">{program.name}</h3>
                        <Badge className={`${getStatusColor(program.status)} border`}>
                          {program.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">
                        {program.description || "No description provided"}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {formatDate(program.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>End: {formatDate(program.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>Owner: {program.ownerId || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCheckRisks(program.id)}
                        disabled={analyzeProgramMutation.isPending}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {analyzeProgramMutation.isPending ? "Analyzing..." : "Check Risks"}
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleViewDetails(program.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}