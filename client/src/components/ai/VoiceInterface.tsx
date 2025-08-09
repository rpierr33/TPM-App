import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, MicOff, Send, Bot, User, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Global types for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface VoiceCommand {
  id: string;
  input: string;
  response: VoiceCommandResponse;
  timestamp: Date;
  success: boolean;
}

interface VoiceCommandResponse {
  success: boolean;
  message: string;
  action?: string;
  data?: any;
  followUp?: string[];
}

export function VoiceInterface() {
  const [isListening, setIsListening] = useState(false);
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const voiceCommandMutation = useMutation({
    mutationFn: async (input: string): Promise<VoiceCommandResponse> => {
      return await apiRequest("/api/ai/voice-command", "POST", { input });
    },
    onSuccess: (data: VoiceCommandResponse, input) => {
      const command: VoiceCommand = {
        id: Date.now().toString(),
        input,
        response: data,
        timestamp: new Date(),
        success: data.success
      };
      setCommands(prev => [command, ...prev]);
      
      if (data.success) {
        toast({
          title: "Command Executed",
          description: data.message,
        });
        
        // Speak the response
        speakText(data.message);
      } else {
        toast({
          title: "Command Failed",
          description: data.message,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Voice Command Error",
        description: "Failed to process voice command",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setCurrentInput(transcript);
          handleVoiceCommand(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setIsRecording(false);
          toast({
            title: "Voice Recognition Error",
            description: "Unable to process voice input",
            variant: "destructive"
          });
        };
      }
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Voice recognition is not supported in this browser",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsRecording(false);
  };

  const handleVoiceCommand = (input: string) => {
    if (input.trim()) {
      voiceCommandMutation.mutate(input);
    }
  };

  const handleTextCommand = () => {
    if (currentInput.trim()) {
      handleVoiceCommand(currentInput);
      setCurrentInput("");
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Voice Interface
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Voice Input Controls */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Say something or type a command..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextCommand()}
              className="w-full px-3 py-2 border rounded-lg pr-10"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1"
              onClick={handleTextCommand}
              disabled={!currentInput.trim() || voiceCommandMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant={isListening ? "destructive" : "default"}
            onClick={isListening ? stopListening : startListening}
            disabled={voiceCommandMutation.isPending}
            className="px-3"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>

        {isRecording && (
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Listening...</span>
            </div>
          </div>
        )}

        {/* Command History */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {commands.map((command) => (
              <div key={command.id} className="space-y-2">
                {/* User Input */}
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm">{command.input}</p>
                    <Badge variant="outline" className="text-xs">
                      {command.timestamp.toLocaleTimeString()}
                    </Badge>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex items-start gap-2 ml-4">
                  <Bot className="h-4 w-4 mt-1 text-green-500" />
                  <div className="flex-1">
                    <p className={`text-sm ${command.success ? 'text-green-700' : 'text-red-700'}`}>
                      {command.response.message}
                    </p>
                    
                    {command.response.followUp && command.response.followUp.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">Suggestions:</p>
                        {command.response.followUp.map((suggestion: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs mr-2 mb-1"
                            onClick={() => handleVoiceCommand(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {command.response.data && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(command.response.data, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={command.success ? "default" : "destructive"} className="text-xs">
                        {command.success ? "Success" : "Failed"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakText(command.response.message)}
                        className="h-6 w-6 p-0"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <hr className="my-3" />
              </div>
            ))}
            
            {commands.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Start by saying something like:</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>"Create a new program called API Migration"</p>
                  <p>"Analyze my current programs"</p>
                  <p>"What risks should I be worried about?"</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}