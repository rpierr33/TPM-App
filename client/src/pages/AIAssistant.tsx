import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { VoiceInterface } from "@/components/ai/VoiceInterface";
import { ChatInterface } from "@/components/ai/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  Mic, 
  MessageSquare, 
  Lightbulb, 
  TrendingUp,
  AlertTriangle,
  Target,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState("voice");
  const { toast } = useToast();

  const { data: briefing, refetch: refetchBriefing } = useQuery({
    queryKey: ["/api/ai/daily-briefing"],
    refetchInterval: 1000 * 60 * 30, // Refresh every 30 minutes
  });

  const analyzeProgramMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ai/analyze-program", "POST", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Program Analysis Complete",
        description: `Found ${data.suggestions?.length || 0} suggestions and ${data.risks?.length || 0} potential risks`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed", 
        description: "Unable to analyze programs at this time",
        variant: "destructive"
      });
    }
  });

  const handleQuickAnalysis = () => {
    analyzeProgramMutation.mutate();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="AI Assistant"
        subtitle="Voice and chat interface for intelligent program management"
        onNewClick={() => refetchBriefing()}
      />

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* AI Capabilities Overview */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI-Powered Program Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Mic className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-semibold">Voice Commands</h4>
                  <p className="text-sm text-gray-600">Create and manage with speech</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-semibold">Smart Chat</h4>
                  <p className="text-sm text-gray-600">Ask questions, get insights</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <h4 className="font-semibold">Proactive Analysis</h4>
                  <p className="text-sm text-gray-600">Auto-identify risks and gaps</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-yellow-500" />
                <div>
                  <h4 className="font-semibold">Smart Suggestions</h4>
                  <p className="text-sm text-gray-600">AI-driven recommendations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Briefing Summary */}
        {briefing && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <h4 className="font-semibold text-sm">Priorities Today</h4>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {briefing.priorities?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Action items</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <h4 className="font-semibold text-sm">Critical Alerts</h4>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {briefing.alerts?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <h4 className="font-semibold text-sm">Recommendations</h4>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {briefing.recommendations?.length || 0}
                </p>
                <p className="text-xs text-gray-500">AI suggestions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <h4 className="font-semibold text-sm">Program Health</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">Good</Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs"
                  onClick={handleQuickAnalysis}
                  disabled={analyzeProgramMutation.isPending}
                >
                  {analyzeProgramMutation.isPending ? "Analyzing..." : "Quick Analysis"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Interface Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-24rem)]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Interface
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Assistant
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice" className="h-full mt-4">
            <VoiceInterface />
          </TabsContent>
          
          <TabsContent value="chat" className="h-full mt-4">
            <ChatInterface />
          </TabsContent>
        </Tabs>

        {/* Voice Commands Guide */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-gray-700 mb-1">Program Management:</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• "Create program called [name]"</p>
                    <p>• "Show program status"</p>
                    <p>• "Analyze program risks"</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-700 mb-1">Risk & Milestone Tracking:</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• "Add milestone for [date]"</p>
                    <p>• "What risks need attention?"</p>
                    <p>• "Show critical alerts"</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-gray-700 mb-1">Quick Actions:</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• "Generate daily briefing"</p>
                    <p>• "Executive report for [program]"</p>
                    <p>• "What should I prioritize?"</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-700 mb-1">Analysis & Insights:</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• "Check program completeness"</p>
                    <p>• "Find missing components"</p>
                    <p>• "Suggest improvements"</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}