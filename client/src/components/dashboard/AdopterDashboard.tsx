import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, Globe, Server, Settings, MessageCircle, Calendar } from "lucide-react";

interface AdopterDashboardProps {
  programId?: string;
}

export function AdopterDashboard({ programId }: AdopterDashboardProps) {
  const { data: adopters = [] } = useQuery({
    queryKey: programId ? ["/api/adopters", { programId }] : ["/api/adopters"],
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": 
      case "ready": return "text-success";
      case "in_progress": return "text-warning";
      case "blocked": return "text-danger";
      default: return "text-gray-500";
    }
  };

  const getIconForTeam = (teamName: string) => {
    const name = teamName.toLowerCase();
    if (name.includes("mobile")) return Smartphone;
    if (name.includes("web") || name.includes("frontend")) return Globe;
    if (name.includes("data") || name.includes("analytics")) return Server;
    return Settings;
  };

  const getIconColor = (readinessScore: number) => {
    if (readinessScore >= 85) return "bg-green-100 text-success";
    if (readinessScore >= 60) return "bg-warning-100 text-warning";
    return "bg-red-100 text-danger";
  };

  const formatReadinessScore = (score: number | null) => {
    return score ? `${score}%` : "0%";
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ready": return "Ready";
      case "in_progress": return "In Progress";
      case "blocked": return "Blocked";
      case "completed": return "Complete";
      default: return "Not Started";
    }
  };

  // Limit to 4 adopters for dashboard view
  const displayedAdopters = adopters.slice(0, 4);

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Adopter Dashboard</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600">
            View All Teams
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {displayedAdopters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No adopter teams found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedAdopters.map((adopter: any) => {
              const IconComponent = getIconForTeam(adopter.teamName);
              const readinessScore = adopter.readinessScore || 0;
              
              return (
                <div key={adopter.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColor(readinessScore)}`}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{adopter.teamName}</h4>
                      <p className="text-xs text-gray-500">
                        {adopter.description || "Team integration progress"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${getStatusColor(adopter.status)}`}>
                      {formatReadinessScore(readinessScore)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getStatusText(adopter.status)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex gap-2">
                <Button className="flex-1 bg-primary-500 text-white hover:bg-primary-600">
                  <MessageCircle size={14} className="mr-1" />
                  Send Update
                </Button>
                <Button variant="outline" className="flex-1">
                  <Calendar size={14} className="mr-1" />
                  Schedule Check-in
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
