import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

interface ActiveRisksTableProps {
  programId?: string;
}

export function ActiveRisksTable({ programId }: ActiveRisksTableProps) {
  const { data: risks = [] } = useQuery({
    queryKey: programId ? ["/api/risks", { programId }] : ["/api/risks"],
  });

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved": return "bg-green-100 text-green-800";
      case "mitigated": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "identified": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Show only active risks (not resolved)
  const activeRisks = risks.filter((risk: any) => 
    risk.status !== "resolved" && risk.status !== "mitigated"
  ).slice(0, 5); // Limit to 5 for dashboard view

  const handlePushToJira = async () => {
    // This would integrate with JIRA API in live mode
    console.log("Pushing risks to JIRA...");
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Active Risks</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePushToJira}
              className="text-primary-500 hover:text-primary-600 text-sm"
            >
              <ExternalLink size={14} className="mr-1" />
              Push to JIRA
            </Button>
            <Button size="sm" className="bg-primary-500 text-white hover:bg-primary-600">
              Add Risk
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {activeRisks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No active risks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeRisks.map((risk: any) => (
                  <tr key={risk.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                        <div className="text-sm text-gray-500">
                          {risk.description?.substring(0, 50)}
                          {risk.description?.length > 50 ? "..." : ""}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getSeverityColor(risk.severity)} font-semibold capitalize`}>
                        {risk.severity || "medium"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {risk.owner?.name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getStatusColor(risk.status)} font-semibold capitalize`}>
                        {risk.status?.replace("_", " ") || "identified"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
