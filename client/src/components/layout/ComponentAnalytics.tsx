import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateProgramHealth, getHealthBadge } from "@/lib/healthCalculation";
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
    risks?: any[];
    milestones?: any[];
    dependencies?: any[];
    adopters?: any[];
    missingComponents?: number;
  };
}

export function ComponentAnalytics({ title, data }: AnalyticsProps) {
  // Calculate health using centralized utility
  const healthMetrics = calculateProgramHealth({
    risks: data.risks || [],
    milestones: data.milestones || [],
    dependencies: data.dependencies || [],
    adopters: data.adopters || [],
    missingComponents: data.missingComponents || 0
  });

  const getHealthIcon = () => {
    if (healthMetrics.score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (healthMetrics.score >= 60) return <Clock className="h-4 w-4 text-yellow-600" />;
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
            <span className={`text-lg font-bold ${healthMetrics.color}`}>
              {healthMetrics.score}%
            </span>
          </div>

          {/* Component Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
              <div className="flex items-center gap-1">
                <Flag className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-600">Milestones</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{data.milestones?.length || 0}</span>
                {healthMetrics.breakdown.overdueMilestones > 0 && (
                  <Badge variant="destructive" className="text-xs h-4 px-1">
                    {healthMetrics.breakdown.overdueMilestones} overdue
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-gray-600">Risks</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{data.risks?.length || 0}</span>
                {healthMetrics.breakdown.criticalRisks > 0 && (
                  <Badge variant="destructive" className="text-xs h-4 px-1">
                    {healthMetrics.breakdown.criticalRisks} critical
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
              <div className="flex items-center gap-1">
                <GitBranch className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-gray-600">Dependencies</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{data.dependencies?.length || 0}</span>
                {healthMetrics.breakdown.blockedDependencies > 0 && (
                  <Badge variant="destructive" className="text-xs h-4 px-1">
                    {healthMetrics.breakdown.blockedDependencies} blocked
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 border border-gray-100 rounded">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-600">Adopters</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{data.adopters?.length || 0}</span>
                {data.adopters && data.adopters.filter(a => a.overallReadiness === 'ready').length > 0 && (
                  <Badge variant="outline" className="text-xs h-4 px-1 bg-green-50 text-green-700 border-green-200">
                    {data.adopters.filter(a => a.overallReadiness === 'ready').length} ready
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}