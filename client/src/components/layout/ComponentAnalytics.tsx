import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Flag,
  GitBranch,
  Users,
  BarChart3
} from "lucide-react";

interface AnalyticsProps {
  title: string;
  data: {
    riskCount?: number;
    criticalRisks?: number;
    dependencyCount?: number;
    blockedDependencies?: number;
    adopterCount?: number;
    readyAdopters?: number;
    milestoneCount?: number;
    overdueMilestones?: number;
    completedMilestones?: number;
  };
}

export function ComponentAnalytics({ title, data }: AnalyticsProps) {
  const getHealthScore = () => {
    const total = (data.riskCount || 0) + (data.dependencyCount || 0) + (data.milestoneCount || 0) + (data.adopterCount || 0);
    if (total === 0) return 0;

    const issues = (data.criticalRisks || 0) + (data.blockedDependencies || 0) + (data.overdueMilestones || 0);
    const positive = (data.readyAdopters || 0) + (data.completedMilestones || 0);
    
    const score = Math.max(0, Math.min(100, 70 - (issues * 15) + (positive * 5)));
    return Math.round(score);
  };

  const healthScore = getHealthScore();
  const getHealthColor = () => {
    if (healthScore >= 80) return "text-green-600";
    if (healthScore >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthIcon = () => {
    if (healthScore >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (healthScore >= 60) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {title} Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Health Score */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              {getHealthIcon()}
              <span className="text-sm font-medium">Health Score</span>
            </div>
            <span className={`text-lg font-bold ${getHealthColor()}`}>
              {healthScore}%
            </span>
          </div>

          {/* Component Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {data.milestoneCount !== undefined && (
              <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
                <div className="flex items-center gap-1">
                  <Flag className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-600">Milestones</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{data.milestoneCount}</span>
                  {data.overdueMilestones && data.overdueMilestones > 0 && (
                    <Badge variant="destructive" className="text-xs h-4 px-1">
                      {data.overdueMilestones} overdue
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {data.riskCount !== undefined && (
              <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-gray-600">Risks</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{data.riskCount}</span>
                  {data.criticalRisks && data.criticalRisks > 0 && (
                    <Badge variant="destructive" className="text-xs h-4 px-1">
                      {data.criticalRisks} critical
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {data.dependencyCount !== undefined && (
              <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
                <div className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3 text-purple-500" />
                  <span className="text-xs text-gray-600">Dependencies</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{data.dependencyCount}</span>
                  {data.blockedDependencies && data.blockedDependencies > 0 && (
                    <Badge variant="destructive" className="text-xs h-4 px-1">
                      {data.blockedDependencies} blocked
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {data.adopterCount !== undefined && (
              <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-600">Adopters</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{data.adopterCount}</span>
                  {data.readyAdopters && data.readyAdopters > 0 && (
                    <Badge variant="outline" className="text-xs h-4 px-1 bg-green-50 text-green-700 border-green-200">
                      {data.readyAdopters} ready
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}