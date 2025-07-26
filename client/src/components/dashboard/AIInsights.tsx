import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Brain, Lightbulb, Users, TrendingUp } from "lucide-react";

interface AIInsightsProps {
  programId?: string;
}

export function AIInsights({ programId }: AIInsightsProps) {
  const { data: insights, isLoading } = useQuery({
    queryKey: programId ? ["/api/ai/insights", { programId }] : ["/api/ai/insights"],
    enabled: false, // Manual trigger for AI insights
  });

  const handleGenerateReport = async () => {
    try {
      // This would trigger report generation
      console.log("Generating AI report...");
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const handleRunScenarioAnalysis = async () => {
    try {
      // This would run scenario analysis
      console.log("Running scenario analysis...");
    } catch (error) {
      console.error("Error running scenario analysis:", error);
    }
  };

  // Default insights for demo - in production these would come from AI service
  const defaultInsights = {
    riskPrediction: "Based on current velocity, the \"API Gateway Migration\" milestone has a 78% chance of delay. Consider adding 2 more engineers or extending deadline by 1 week.",
    adopterSupport: "Data Analytics Team shows concerning progress. Recommend immediate escalation and technical deep-dive session with platform team.",
    programHealth: "Overall program health score is 84%. Top performing area: Mobile integration. Area needing attention: Legacy system migration."
  };

  const displayInsights = insights || defaultInsights;

  return (
    <Card className="gradient-purple-blue border border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Brain className="text-purple-500" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insights & Recommendations</h3>
            
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <Lightbulb className="text-yellow-500 mt-1 flex-shrink-0" size={16} />
                  <p>
                    <strong>Risk Prediction:</strong> {displayInsights.riskPrediction}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="text-blue-500 mt-1 flex-shrink-0" size={16} />
                  <p>
                    <strong>Adopter Support:</strong> {displayInsights.adopterSupport}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="text-green-500 mt-1 flex-shrink-0" size={16} />
                  <p>
                    <strong>Program Health:</strong> {displayInsights.programHealth}
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={handleGenerateReport}
                className="bg-purple-500 text-white hover:bg-purple-600"
              >
                Generate Report
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRunScenarioAnalysis}
                className="bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Run Scenario Analysis
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
