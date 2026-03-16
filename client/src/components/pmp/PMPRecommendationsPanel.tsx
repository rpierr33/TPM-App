import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  Shuffle,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface PMPRecommendationsPanelProps {
  programId?: string;
}

export function PMPRecommendationsPanel({ programId }: PMPRecommendationsPanelProps) {
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [drillContent, setDrillContent] = useState<Record<string, string>>({});
  const [altContent, setAltContent] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const { data: recommendations = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/pmp-recommendations", { programId }],
    queryFn: () =>
      apiRequest(
        `/api/pmp-recommendations${programId ? `?programId=${programId}` : ""}`,
        "GET"
      ),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/pmp-recommendations/generate", "POST", { programId }),
    onSuccess: () => {
      refetch();
      toast({ title: "Recommendations generated", description: "PMP recommendations updated based on current program state." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate recommendations.", variant: "destructive" });
    },
  });

  const drillMutation = useMutation({
    mutationFn: (recId: string) =>
      apiRequest(`/api/pmp-recommendations/${recId}/drill-deeper`, "POST", {}),
    onSuccess: (data: any, recId) => {
      setDrillContent(prev => ({ ...prev, [recId]: data.explanation }));
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to get deeper explanation.", variant: "destructive" });
    },
  });

  const altMutation = useMutation({
    mutationFn: (recId: string) =>
      apiRequest(`/api/pmp-recommendations/${recId}/alternatives`, "POST", {}),
    onSuccess: (data: any, recId) => {
      setAltContent(prev => ({ ...prev, [recId]: data.alternatives }));
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to get alternatives.", variant: "destructive" });
    },
  });

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-100 text-red-800 border-red-200";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "Critical";
    if (priority >= 5) return "High";
    return "Medium";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle size={14} className="text-green-600" />;
      case "in_progress": return <Clock size={14} className="text-blue-600" />;
      default: return <AlertTriangle size={14} className="text-yellow-600" />;
    }
  };

  // Sort by priority descending, show top 10
  const topRecommendations = [...recommendations]
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, 10);

  const phaseColors: Record<string, string> = {
    "Initiating": "bg-blue-100 text-blue-800",
    "Planning": "bg-purple-100 text-purple-800",
    "Executing": "bg-orange-100 text-orange-800",
    "Monitoring & Controlling": "bg-yellow-100 text-yellow-800",
    "Closing": "bg-green-100 text-green-800",
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">PMP Recommendations</CardTitle>
            <Badge variant="outline" className="text-xs text-gray-500">
              PMI/PMBOK Aligned
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {generateMutation.isPending ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <RefreshCw size={14} className="mr-1" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : topRecommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-3">No recommendations yet.</p>
            <Button
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {generateMutation.isPending ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <Lightbulb size={14} className="mr-1" />
              )}
              Generate Recommendations
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {topRecommendations.map((rec) => (
              <Collapsible
                key={rec.id}
                open={expandedRec === rec.id}
                onOpenChange={(open) => setExpandedRec(open ? rec.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      {expandedRec === rec.id ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug">
                        {rec.recommendation}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={`text-xs ${phaseColors[rec.pmpPhase] || "bg-gray-100 text-gray-700"}`}>
                          {rec.pmpPhase}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-gray-500">
                          {rec.knowledgeArea}
                        </Badge>
                        <Badge className={`text-xs border ${getPriorityColor(rec.priority ?? 0)}`}>
                          {getPriorityLabel(rec.priority ?? 0)}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          {getStatusIcon(rec.status)}
                          {rec.status?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="ml-7 mt-2 space-y-3">
                    {/* Reasoning */}
                    {rec.reasoning && (
                      <p className="text-sm text-gray-600 italic">{rec.reasoning}</p>
                    )}

                    {/* Drill Deeper */}
                    {drillContent[rec.id] ? (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Deep Dive</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{drillContent[rec.id]}</p>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => drillMutation.mutate(rec.id)}
                        disabled={drillMutation.isPending && drillMutation.variables === rec.id}
                      >
                        {drillMutation.isPending && drillMutation.variables === rec.id ? (
                          <Loader2 size={12} className="mr-1 animate-spin" />
                        ) : (
                          <BookOpen size={12} className="mr-1" />
                        )}
                        Dig Deeper
                      </Button>
                    )}

                    {/* Alternatives */}
                    {altContent[rec.id] ? (
                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-700 mb-1">Alternative Approaches</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{altContent[rec.id]}</p>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => altMutation.mutate(rec.id)}
                        disabled={altMutation.isPending && altMutation.variables === rec.id}
                      >
                        {altMutation.isPending && altMutation.variables === rec.id ? (
                          <Loader2 size={12} className="mr-1 animate-spin" />
                        ) : (
                          <Shuffle size={12} className="mr-1" />
                        )}
                        Find Alternatives
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {recommendations.length > 10 && (
              <p className="text-xs text-center text-gray-400 pt-2">
                Showing top 10 of {recommendations.length} recommendations
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
