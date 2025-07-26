import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface RiskHeatmapProps {
  programId?: string;
}

export function RiskHeatmap({ programId }: RiskHeatmapProps) {
  const { data: risks = [] } = useQuery({
    queryKey: programId ? ["/api/risks", { programId }] : ["/api/risks"],
  });

  // Calculate risk matrix data
  const getRiskMatrix = () => {
    const matrix = {
      high: { low: 0, medium: 0, high: 0, critical: 0 },
      medium: { low: 0, medium: 0, high: 0, critical: 0 },
      low: { low: 0, medium: 0, high: 0, critical: 0 },
    };

    risks.forEach((risk: any) => {
      const probability = risk.probability || 2; // default to medium
      const impact = risk.impact || 2; // default to medium
      
      const probLevel = probability <= 1 ? 'low' : probability <= 3 ? 'medium' : 'high';
      const impactLevel = impact <= 1 ? 'low' : impact <= 2 ? 'medium' : impact <= 3 ? 'high' : 'critical';
      
      matrix[probLevel as keyof typeof matrix][impactLevel as keyof typeof matrix.high]++;
    });

    return matrix;
  };

  const matrix = getRiskMatrix();

  const getCellColor = (count: number) => {
    if (count === 0) return "bg-gray-100";
    if (count <= 2) return "bg-success text-white";
    if (count <= 4) return "bg-warning";
    return "bg-danger text-white";
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Risk Heatmap</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Impact →</span>
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>
          
          {/* Risk Matrix Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2">
              <div className="text-xs text-gray-500 flex items-center">High</div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.high.low)}`}>
                {matrix.high.low || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.high.medium)}`}>
                {matrix.high.medium || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.high.high)}`}>
                {matrix.high.high || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.high.critical)}`}>
                {matrix.high.critical || ""}
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              <div className="text-xs text-gray-500 flex items-center">Med</div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.medium.low)}`}>
                {matrix.medium.low || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.medium.medium)}`}>
                {matrix.medium.medium || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.medium.high)}`}>
                {matrix.medium.high || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.medium.critical)}`}>
                {matrix.medium.critical || ""}
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              <div className="text-xs text-gray-500 flex items-center">Low</div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.low.low)}`}>
                {matrix.low.low || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.low.medium)}`}>
                {matrix.low.medium || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.low.high)}`}>
                {matrix.low.high || ""}
              </div>
              <div className={`h-12 rounded flex items-center justify-center text-xs font-medium ${getCellColor(matrix.low.critical)}`}>
                {matrix.low.critical || ""}
              </div>
            </div>
          </div>

          {/* Risk Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-success rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-warning rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-danger rounded"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
