import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Brain, Lightbulb, Users, TrendingUp, RefreshCw } from "lucide-react";

interface AIInsightsProps {
  programId?: string;
}

export function AIInsights({ programId }: AIInsightsProps) {
  const { toast } = useToast();

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: programId ? ["/api/ai/insights", programId] : ["/api/ai/insights"],
    queryFn: () => apiRequest(
      programId ? `/api/ai/insights?programId=${programId}` : `/api/ai/insights`,
      "GET"
    ),
    staleTime: 5 * 60 * 1000,
  });

  const generateReportMutation = useMutation({
    mutationFn: () => apiRequest("/api/reports/generate", "POST", {
      type: "weekly",
      programId: programId || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Report generated", description: "Weekly report is ready in Executive Reports." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    },
  });

  const analyzeScenarioMutation = useMutation({
    mutationFn: () => apiRequest("/api/ai/analyze", "POST", { programId: programId || null }),
    onSuccess: () => {
      refetch();
      toast({ title: "Analysis complete", description: "AI insights have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to run scenario analysis.", variant: "destructive" });
    },
  });

  const displayInsights = insights || {
    riskPrediction: "Run analysis to get AI-powered risk predictions for your programs.",
    adopterSupport: "Run analysis to assess adopter readiness and identify teams that need support.",
    programHealth: "Run analysis to get an overall program health score and recommendations.",
  };

  return (
    <Card className="gradient-purple-blue border border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Brain className="text-purple-500" size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">AI Insights & Recommendations</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="text-purple-600 hover:text-purple-700"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
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
                onClick={() => generateReportMutation.mutate()}
                disabled={generateReportMutation.isPending}
                className="bg-purple-500 text-white hover:bg-purple-600"
              >
                {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
              </Button>
              <Button
                variant="outline"
                onClick={() => analyzeScenarioMutation.mutate()}
                disabled={analyzeScenarioMutation.isPending}
                className="bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                {analyzeScenarioMutation.isPending ? "Analyzing..." : "Run Scenario Analysis"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
