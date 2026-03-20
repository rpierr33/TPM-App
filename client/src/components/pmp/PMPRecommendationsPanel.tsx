import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
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
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
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
      toast({ title: "Recommendations generated", description: "PMP recommendations updated." });
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
  });

  const altMutation = useMutation({
    mutationFn: (recId: string) =>
      apiRequest(`/api/pmp-recommendations/${recId}/alternatives`, "POST", {}),
    onSuccess: (data: any, recId) => {
      setAltContent(prev => ({ ...prev, [recId]: data.alternatives }));
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
      case "completed": return <CheckCircle size={12} className="text-green-600" />;
      case "in_progress": return <Clock size={12} className="text-blue-600" />;
      default: return <AlertTriangle size={12} className="text-yellow-600" />;
    }
  };

  // Only show high-priority (5+) recommendations, sorted by priority
  const relevantRecs = [...recommendations]
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .filter(r => (r.priority ?? 0) >= 5);

  const visibleRecs = showAll ? relevantRecs : relevantRecs.slice(0, 3);
  const hasMore = relevantRecs.length > 3;
  const totalCount = relevantRecs.length;

  const phaseColors: Record<string, string> = {
    "Initiating": "bg-blue-100 text-blue-800",
    "Planning": "bg-purple-100 text-purple-800",
    "Executing": "bg-orange-100 text-orange-800",
    "Monitoring & Controlling": "bg-yellow-100 text-yellow-800",
    "Closing": "bg-green-100 text-green-800",
  };

  return (
    <Card className="border border-gray-200/80 shadow-sm">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">PMP Recommendations</span>
          {totalCount > 0 && (
            <Badge className="bg-blue-50 text-blue-700 text-[10px]">{totalCount} actionable</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); generateMutation.mutate(); }}
            disabled={generateMutation.isPending}
            className="h-7 px-2 text-[11px] text-blue-600 hover:bg-blue-50"
          >
            {generateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </Button>
          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expandable content */}
      {isOpen && (
        <CardContent className="pt-0 pb-3 px-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-10 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : visibleRecs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-[12px] mb-2">No high-priority recommendations.</p>
              <Button size="sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700 text-[11px] h-7">
                Generate
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {visibleRecs.map((rec) => (
                <Collapsible key={rec.id} open={expandedRec === rec.id}
                  onOpenChange={(open) => setExpandedRec(open ? rec.id : null)}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        {expandedRec === rec.id ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-900 leading-snug">{rec.recommendation}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge className={`text-[9px] px-1.5 py-0 ${phaseColors[rec.pmpPhase] || "bg-gray-100 text-gray-700"}`}>
                            {rec.pmpPhase}
                          </Badge>
                          <Badge className={`text-[9px] px-1.5 py-0 border ${getPriorityColor(rec.priority ?? 0)}`}>
                            {getPriorityLabel(rec.priority ?? 0)}
                          </Badge>
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                            {getStatusIcon(rec.status)}
                            {rec.status?.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-6 mt-1.5 space-y-2 pb-1">
                      {rec.reasoning && (
                        <p className="text-[11px] text-gray-500 italic">{rec.reasoning}</p>
                      )}
                      <div className="flex gap-2">
                        {drillContent[rec.id] ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 flex-1">
                            <p className="text-[10px] font-semibold text-blue-700 mb-1">Deep Dive</p>
                            <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{drillContent[rec.id]}</p>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] text-blue-600 border-blue-200"
                            onClick={() => drillMutation.mutate(rec.id)}
                            disabled={drillMutation.isPending && drillMutation.variables === rec.id}>
                            {drillMutation.isPending && drillMutation.variables === rec.id ? <Loader2 size={10} className="mr-1 animate-spin" /> : <BookOpen size={10} className="mr-1" />}
                            Dig Deeper
                          </Button>
                        )}
                        {altContent[rec.id] ? (
                          <div className="bg-purple-50 border border-purple-100 rounded-lg p-2 flex-1">
                            <p className="text-[10px] font-semibold text-purple-700 mb-1">Alternatives</p>
                            <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{altContent[rec.id]}</p>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] text-purple-600 border-purple-200"
                            onClick={() => altMutation.mutate(rec.id)}
                            disabled={altMutation.isPending && altMutation.variables === rec.id}>
                            {altMutation.isPending && altMutation.variables === rec.id ? <Loader2 size={10} className="mr-1 animate-spin" /> : <Shuffle size={10} className="mr-1" />}
                            Alternatives
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}

              {hasMore && (
                <button onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium pt-1 pl-2">
                  {showAll ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showAll ? 'Show less' : `Show all ${totalCount} recommendations`}
                </button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
