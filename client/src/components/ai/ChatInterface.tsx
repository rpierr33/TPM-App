import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, Bot, User, Brain, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  type: 'user' | 'ai';
}

interface Suggestion {
  text: string;
  action: () => void;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [context, setContext] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: briefing } = useQuery({
    queryKey: ["/api/ai/daily-briefing"],
    refetchInterval: 1000 * 60 * 30, // Refresh every 30 minutes
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest("/api/ai/chat", "POST", { message, context });
    },
    onSuccess: (data, message) => {
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        message,
        response: data.response,
        timestamp: new Date(),
        type: 'user'
      };
      setMessages(prev => [...prev, chatMessage]);
    },
    onError: (error) => {
      toast({
        title: "Chat Error",
        description: "Failed to process your message",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      chatMutation.mutate(currentMessage);
      setCurrentMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestions: Suggestion[] = [
    {
      text: "What's my program status today?",
      action: () => setCurrentMessage("What's my program status today?")
    },
    {
      text: "Show me critical risks",
      action: () => setCurrentMessage("Show me critical risks")
    },
    {
      text: "Create a new milestone",
      action: () => setCurrentMessage("Create a new milestone")
    },
    {
      text: "Analyze program gaps",
      action: () => setCurrentMessage("Analyze program gaps")
    },
    {
      text: "Generate executive report",
      action: () => setCurrentMessage("Generate executive report")
    },
    {
      text: "What should I prioritize?",
      action: () => setCurrentMessage("What should I prioritize?")
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Chat Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col h-[calc(100%-5rem)]">
        {/* Daily Briefing */}
        {briefing && (
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4" />
                Daily Briefing
              </h4>
              <p className="text-sm mb-2">{briefing.summary}</p>
              
              {briefing.alerts && briefing.alerts.length > 0 && (
                <div className="mb-2">
                  <Badge variant="destructive" className="text-xs mb-1">Alerts</Badge>
                  <ul className="text-xs space-y-1">
                    {briefing.alerts.slice(0, 2).map((alert: string, i: number) => (
                      <li key={i}>• {alert}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {briefing.priorities && briefing.priorities.length > 0 && (
                <div>
                  <Badge variant="default" className="text-xs mb-1">Top Priorities</Badge>
                  <ul className="text-xs space-y-1">
                    {briefing.priorities.slice(0, 3).map((priority: string, i: number) => (
                      <li key={i}>• {priority}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
          <div className="space-y-4 pr-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-4">I'm your AI TPM assistant. Ask me anything about your programs!</p>
                
                <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={suggestion.action}
                    >
                      {suggestion.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {/* User Message */}
                <div className="flex items-start gap-3">
                  <User className="h-6 w-6 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm">{msg.message}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </Badge>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex items-start gap-3 ml-4">
                  <Bot className="h-6 w-6 mt-1 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{msg.response}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start gap-3">
                <Bot className="h-6 w-6 mt-1 text-green-500" />
                <div className="flex-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Suggestions */}
        {messages.length === 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-1">
              {suggestions.slice(4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6"
                  onClick={suggestion.action}
                >
                  {suggestion.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask me about your programs, risks, milestones..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || chatMutation.isPending}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}