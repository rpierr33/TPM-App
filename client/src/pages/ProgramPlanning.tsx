import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { ArrowLeft, Building2, Target, Calendar, Users } from "lucide-react";
import { ProgramPhaseManager } from "@/components/phases/ProgramPhaseManager";
import type { Program } from "@shared/schema";

export default function ProgramPlanning() {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [, setLocation] = useLocation();

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  // Check for program ID in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const programIdFromUrl = urlParams.get('id');
    if (programIdFromUrl && programs.some(p => p.id === programIdFromUrl)) {
      setSelectedProgramId(programIdFromUrl);
    }
  }, [programs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "planning": return "bg-blue-100 text-blue-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!selectedProgram) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/dashboard")}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Program Planning & Phase Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage program phases following PMI PMP standards
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target size={20} className="text-blue-600" />
                Select Program for Phase Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {programs.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
                  <p className="text-gray-500 mb-4">
                    Create a program first to start managing phases and project planning.
                  </p>
                  <Button onClick={() => setLocation("/programs")}>
                    Go to Programs
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Program:
                    </label>
                    <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program to manage phases..." />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            <div className="flex items-center gap-2">
                              <span>{program.name}</span>
                              <Badge variant="outline" className={getStatusColor(program.status || "planning")}>
                                {program.status || "planning"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={16} className="text-blue-600" />
                          <span className="font-medium text-blue-800">5 PMI Phases</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Initiation, Planning, Execution, Monitoring & Controlling, Closure
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={16} className="text-green-600" />
                          <span className="font-medium text-green-800">Guided Workflow</span>
                        </div>
                        <p className="text-sm text-green-700">
                          Step-by-step process with templates and best practices
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={16} className="text-purple-600" />
                          <span className="font-medium text-purple-800">AI Recommendations</span>
                        </div>
                        <p className="text-sm text-purple-700">
                          Smart suggestions based on project phase and context
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedProgramId("")}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Program Selection
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Program Phase Management</h1>
              <p className="text-gray-600 mt-1">
                Managing phases for program: <span className="font-medium">{selectedProgram.name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6">
        <ProgramPhaseManager program={selectedProgram} />
      </main>
    </div>
  );
}