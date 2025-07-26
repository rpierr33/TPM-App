import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface ProgramTimelineProps {
  programId?: string;
}

export function ProgramTimeline({ programId }: ProgramTimelineProps) {
  const { data: milestones = [] } = useQuery({
    queryKey: programId ? ["/api/milestones", { programId }] : ["/api/milestones"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success";
      case "in_progress": return "bg-warning";
      case "at_risk": return "bg-danger";
      default: return "bg-gray-300";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Sort milestones by due date
  const sortedMilestones = [...milestones]
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
    .slice(0, 4); // Show only first 4 milestones

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Program Timeline</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600">
            View Full Roadmap
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedMilestones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No milestones found</p>
            </div>
          ) : (
            sortedMilestones.map((milestone: any, index) => (
              <div key={milestone.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 ${getStatusColor(milestone.status)} rounded-full`} />
                  {index < sortedMilestones.length - 1 && (
                    <div className="w-px h-8 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{milestone.title}</h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(milestone.dueDate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {milestone.description || "No description available"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
