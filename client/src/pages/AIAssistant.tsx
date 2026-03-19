import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAppStore } from "@/stores/appStore";
import {
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Volume2,
  VolumeX,
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flag,
  Users,
  Trash2,
  StopCircle,
  Sparkles,
  ArrowRight,
  Activity
} from "lucide-react";
import type { Program, Risk, Milestone } from "@shared/schema";

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

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  responseType?: 'text' | 'image' | 'file' | 'action' | 'success' | 'error';
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
  actions?: {
    type: 'navigate' | 'create' | 'update' | 'delete';
    target: string;
    data?: any;
  }[];
  createdItems?: {
    type: 'program' | 'risk' | 'milestone' | 'adopter' | 'dependency';
    id: string;
    name: string;
  }[];
}

// Render simple markdown-like formatting in AI messages
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-[13px] leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <p key={i} className="font-semibold text-gray-900 mt-2">{line.replace('### ', '')}</p>;
        }
        if (line.startsWith('## ')) {
          return <p key={i} className="font-bold text-gray-900 mt-2">{line.replace('## ', '')}</p>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-gray-400 mt-0.5 select-none">•</span>
              <span className="text-gray-700">{formatInline(line.replace(/^[-•]\s/, ''))}</span>
            </div>
          );
        }
        if (line.match(/^\d+\.\s/)) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-gray-500 min-w-[16px] font-medium">{line.match(/^\d+/)![0]}.</span>
              <span className="text-gray-700">{formatInline(line.replace(/^\d+\.\s/, ''))}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-gray-700">{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
          : part
      )}
    </>
  );
}

const QUICK_COMMANDS = [
  { label: "Analyze all risks", icon: AlertTriangle, color: "text-red-500" },
  { label: "Show overdue milestones", icon: Flag, color: "text-amber-500" },
  { label: "Generate status report", icon: Activity, color: "text-blue-500" },
  { label: "List programs with missing components", icon: Zap, color: "text-violet-500" },
  { label: "Create a new program", icon: Sparkles, color: "text-emerald-500" },
  { label: "Which programs are at risk?", icon: AlertCircle, color: "text-orange-500" },
  { label: "Summarize team adoption status", icon: Users, color: "text-cyan-500" },
  { label: "What are the blocked dependencies?", icon: ArrowRight, color: "text-pink-500" },
];

export default function AIAssistant() {
  const { chatMessages, addChatMessage, clearChatHistory } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);
  const [responseMode, setResponseMode] = useState<'text' | 'voice'>('text');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceFlagRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: programs = [] } = useQuery<Program[]>({ queryKey: ["/api/programs"], refetchInterval: 4 * 60 * 1000 });
  const { data: risks = [] } = useQuery<Risk[]>({ queryKey: ["/api/risks"], refetchInterval: 4 * 60 * 1000 });
  const { data: milestones = [] } = useQuery<Milestone[]>({ queryKey: ["/api/milestones"], refetchInterval: 4 * 60 * 1000 });

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 80);
  };

  const aiActionMutation = useMutation({
    mutationFn: async (request: string) => {
      const recentHistory = chatMessages.slice(-6).map(m =>
        `${m.type === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`
      ).join('\n');

      return await apiRequest('/api/ai/process-request', 'POST', {
        request,
        context: {
          programCount: programs.length,
          riskCount: risks.length,
          milestoneCount: milestones.length,
          programs: programs.map(p => ({ id: p.id, name: p.name, status: p.status })),
          recentHistory
        }
      });
    },
    onSuccess: (response) => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.message || 'Action completed successfully!',
        timestamp: new Date(),
        responseType: response.success ? 'success' : 'error',
        createdItems: response.createdItems,
        actions: response.actions
      };

      addChatMessage(aiResponse);
      setIsProcessing(false);
      scrollToBottom();

      if (response.createdItems && response.createdItems.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
        queryClient.invalidateQueries({ queryKey: ["/api/adopters"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dependencies"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      }

      if (response.actions) {
        response.actions.forEach((action: any) => {
          if (action.type === 'navigate') {
            setTimeout(() => setLocation(action.target), 1200);
          }
        });
      }

      if (responseMode === 'voice' && response.message) {
        speakText(response.message);
      }
    },
    onError: (error) => {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Sorry, I ran into an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        responseType: 'error'
      });
      setIsProcessing(false);
      scrollToBottom();
    }
  });

  const sendMessage = (text: string, fromVoice = false) => {
    if (!text.trim() || isProcessing) return;
    voiceFlagRef.current = fromVoice;

    addChatMessage({
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    });

    setInputValue('');
    setLastInputWasVoice(false);
    setIsProcessing(true);
    scrollToBottom();
    aiActionMutation.mutate(text);
  };

  const handleSendMessage = () => {
    sendMessage(inputValue, lastInputWasVoice);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setLastInputWasVoice(true);
        inputRef.current?.focus();
      };

      recognition.onend = () => setIsListening(false);

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: event.error === 'not-allowed'
            ? "Microphone access denied. Allow it in browser settings."
            : event.error === 'no-speech'
            ? "No speech detected. Try again."
            : "Voice input failed. Try again.",
          variant: "destructive"
        });
      };
    }
  }, []);

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast({ title: "Not Supported", description: "Voice recognition is not available in this browser.", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.substring(0, 500));
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      clearChatHistory();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activePrograms = programs.filter(p => p.status === 'active' || p.status === 'planning');
  const highRisks = risks.filter(r => r.severity === 'critical' || r.severity === 'high');
  const overdueMilestones = milestones.filter(m =>
    m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed'
  );

  const LONG_MESSAGE_THRESHOLD = 600;

  return (
    <div className="flex-1 flex flex-col overflow-hidden page-transition">
      <Header
        title="AI Assistant"
        subtitle="Chat with your TPM AI — create, analyze, and manage programs by text or voice"
        showNewButton={false}
      />

      <main className="flex-1 flex gap-5 overflow-hidden p-5">
        {/* LEFT: Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Chat Header */}
            <div className="border-b border-gray-100 py-3 px-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">TPM AI Assistant</p>
                    <p className="text-[11px] text-gray-400">Powered by Claude &middot; {programs.length} programs loaded</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Response Mode Toggle */}
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setResponseMode('text')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                        responseMode === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FileText className="h-3 w-3" />
                      Text
                    </button>
                    <button
                      onClick={() => setResponseMode('voice')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                        responseMode === 'voice' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Volume2 className="h-3 w-3" />
                      Voice
                    </button>
                  </div>

                  {isListening && (
                    <Badge className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1 animate-pulse text-[11px]">
                      <Mic className="h-3 w-3" />
                      Listening
                    </Badge>
                  )}

                  {isSpeaking && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopSpeaking}
                      className="flex items-center gap-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 h-7 px-2 text-xs font-medium"
                      title="Stop speaking"
                    >
                      <StopCircle className="h-3.5 w-3.5" />
                      Stop
                    </Button>
                  )}

                  <button
                    onClick={handleClearChat}
                    className="p-1.5 rounded-md text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    title="Clear chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-gray-50/30"
            >
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-5">
                    <Sparkles className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How can I help you today?</h3>
                  <p className="text-sm text-gray-500 max-w-md mb-6">
                    I can create programs, analyze risks, generate reports, and manage your entire TPM workflow.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-lg">
                    {QUICK_COMMANDS.slice(0, 4).map((cmd) => (
                      <button
                        key={cmd.label}
                        onClick={() => sendMessage(cmd.label)}
                        disabled={isProcessing}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group disabled:opacity-40"
                      >
                        <cmd.icon className={`h-4 w-4 ${cmd.color} flex-shrink-0`} />
                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{cmd.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((message) => {
                const isLong = message.content.length > LONG_MESSAGE_THRESHOLD;
                const isExpanded = expandedMessages.has(message.id);
                const displayContent = isLong && !isExpanded
                  ? message.content.substring(0, LONG_MESSAGE_THRESHOLD) + '...'
                  : message.content;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'ai' && (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        message.responseType === 'error'
                          ? 'bg-red-100'
                          : message.responseType === 'success'
                          ? 'bg-emerald-100'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {message.responseType === 'error'
                          ? <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          : message.responseType === 'success'
                          ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          : <Sparkles className="h-3 w-3 text-white" />
                        }
                      </div>
                    )}

                    <div className={`max-w-[75%] group ${message.type === 'user' ? 'order-2' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md shadow-sm shadow-blue-600/20'
                            : message.responseType === 'error'
                            ? 'bg-red-50 border border-red-100 text-gray-900 rounded-bl-md'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm'
                        }`}
                      >
                        {message.type === 'user' ? (
                          <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        ) : (
                          <FormattedText text={displayContent} />
                        )}

                        {isLong && (
                          <button
                            onClick={() => toggleExpand(message.id)}
                            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 mt-2 font-medium"
                          >
                            {isExpanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Read more</>}
                          </button>
                        )}

                        {/* Created Items */}
                        {message.createdItems && message.createdItems.length > 0 && (
                          <div className="mt-3 space-y-1.5 pt-2.5 border-t border-gray-100">
                            <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Created {message.createdItems.length} item{message.createdItems.length > 1 ? 's' : ''}
                            </div>
                            {message.createdItems.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100"
                              >
                                <span className="text-[11px] flex-1">
                                  <span className="font-medium capitalize text-emerald-800">{item.type}</span>
                                  <span className="text-gray-600 ml-1">{item.name}</span>
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800"
                                  onClick={() => {
                                    if (item.type === 'program') setLocation(`/programs/${item.id}`);
                                    else if (item.type === 'risk') setLocation(`/risk-management`);
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Navigation Actions */}
                        {message.actions && message.actions.filter(a => a.type === 'navigate').length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.actions.filter(a => a.type === 'navigate').map((action, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px] border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                                onClick={() => setLocation(action.target)}
                              >
                                Go to {action.target.split('?')[0].replace(/^\//, '').replace(/-/g, ' ')}
                                <ExternalLink className="h-2.5 w-2.5 ml-1" />
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message footer */}
                      <div className={`flex items-center gap-2 mt-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-400">{formatTime(message.timestamp)}</span>
                        {message.type === 'ai' && (
                          <button
                            onClick={() => copyMessage(message.id, message.content)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500"
                            title="Copy"
                          >
                            {copiedId === message.id
                              ? <CheckCircle className="h-3 w-3 text-emerald-500" />
                              : <Copy className="h-3 w-3" />
                            }
                          </button>
                        )}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5 order-3">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-3 w-3 text-white animate-pulse" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[11px] text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Voice capture banner */}
            {lastInputWasVoice && inputValue && (
              <div className="mx-4 mb-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-[11px] text-blue-700">
                <Mic className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Voice captured — review then press <strong>Send</strong> or edit</span>
                <button
                  className="ml-auto text-blue-400 hover:text-blue-600"
                  onClick={() => { setLastInputWasVoice(false); }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-100 p-3 flex-shrink-0 bg-white">
              <div className="flex items-end gap-2">
                <Button
                  variant={isListening ? "default" : "outline"}
                  size="sm"
                  onClick={toggleVoiceRecognition}
                  className={`flex-shrink-0 h-9 w-9 p-0 rounded-xl ${isListening ? 'bg-red-500 hover:bg-red-600 border-red-500' : 'border-gray-200 hover:bg-gray-50'}`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (e.target.value === '') setLastInputWasVoice(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything or give a command..."
                  disabled={isProcessing}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 disabled:opacity-50 min-h-[38px] max-h-32 overflow-y-auto bg-gray-50/50 placeholder:text-gray-400 transition-all"
                  style={{ lineHeight: '1.5' }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
                  }}
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  size="sm"
                  className="flex-shrink-0 h-9 w-9 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[10px] text-gray-400">
                  {responseMode === 'voice' ? (
                    <span className="flex items-center gap-1 text-orange-500">
                      <Volume2 className="h-3 w-3" /> Responses read aloud
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <VolumeX className="h-3 w-3" /> Text only
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-gray-300">Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar">

          {/* Live Context */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Live Context</h3>
            </div>
            <div className="p-3 space-y-1">
              {[
                { icon: Zap, label: "Active Programs", value: activePrograms.length, color: "text-emerald-500", bg: "bg-emerald-50", textColor: "text-emerald-700" },
                { icon: AlertTriangle, label: "High/Critical Risks", value: highRisks.length, color: "text-red-500", bg: highRisks.length > 0 ? "bg-red-50" : "bg-gray-50", textColor: highRisks.length > 0 ? "text-red-700" : "text-gray-600" },
                { icon: Flag, label: "Overdue Milestones", value: overdueMilestones.length, color: "text-amber-500", bg: overdueMilestones.length > 0 ? "bg-amber-50" : "bg-gray-50", textColor: overdueMilestones.length > 0 ? "text-amber-700" : "text-gray-600" },
                { icon: Users, label: "Total Programs", value: programs.length, color: "text-blue-500", bg: "bg-blue-50", textColor: "text-blue-700" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span className="text-[12px] text-gray-600">{item.label}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${item.bg} ${item.textColor}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Commands */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick Commands</h3>
            </div>
            <div className="p-2 space-y-0.5">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => sendMessage(cmd.label)}
                  disabled={isProcessing}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                  <cmd.icon className={`h-3.5 w-3.5 ${cmd.color} flex-shrink-0`} />
                  <span className="group-hover:translate-x-0.5 transition-transform">{cmd.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-blue-100/50">
              <h3 className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Tips</h3>
            </div>
            <div className="p-4 space-y-2.5 text-[11px] text-gray-600 leading-relaxed">
              <p>Say <strong className="text-gray-800">"Create 3 programs"</strong> to bulk create</p>
              <p>Say <strong className="text-gray-800">"Delete the oldest 2"</strong> to remove by age</p>
              <p>Ask <strong className="text-gray-800">"What's missing from X?"</strong> for PMI gap analysis</p>
              <p>Use <strong className="text-gray-800">voice mode</strong> to hear responses aloud</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
