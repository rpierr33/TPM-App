import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User,
  Volume2,
  FileText,
  Image,
  Download,
  Zap
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  responseType?: 'text' | 'image' | 'file' | 'action';
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant for program management. You can ask me questions, give voice commands, or request analysis. How can I help you today?',
      timestamp: new Date(),
      responseType: 'text'
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you want to "${inputValue}". Let me help you with that. Based on your current program data, here's what I found...`,
        timestamp: new Date(),
        responseType: 'text'
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1500);
  };

  const toggleVoiceRecognition = () => {
    setIsListening(!isListening);
    // Voice recognition logic would go here
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResponseIcon = (responseType: string) => {
    switch (responseType) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      case 'action': return <Zap className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="AI Assistant"
        subtitle="Chat and voice commands for intelligent program management"
      />

      <main className="flex-1 flex flex-col overflow-hidden p-6">
        {/* Chat Messages Area */}
        <Card className="flex-1 flex flex-col border border-gray-200 mb-6">
          <CardHeader className="border-b border-gray-100 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary-600" />
                AI Chat Assistant
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={isListening ? "default" : "secondary"} className="flex items-center gap-1">
                  {isListening ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  {isListening ? 'Listening...' : 'Voice Ready'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      {getResponseIcon(message.responseType || 'text')}
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${message.type === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-lg p-4 ${
                        message.type === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div 
                              key={index}
                              className="flex items-center gap-2 p-2 bg-white/10 rounded border"
                            >
                              {attachment.type === 'image' ? (
                                <Image className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              <span className="text-xs flex-1">{attachment.name}</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 order-3">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="max-w-[70%]">
                    <div className="rounded-lg p-4 bg-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant={isListening ? "default" : "outline"}
                  size="sm"
                  onClick={toggleVoiceRecognition}
                  className={`flex items-center gap-2 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Voice
                    </>
                  )}
                </Button>
                
                <div className="flex-1 flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message or ask a question..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isProcessing}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Showcase Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Commands */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm">Quick Commands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setInputValue("Analyze program risks")}
              >
                <Zap className="h-3 w-3 mr-2" />
                Analyze program risks
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setInputValue("Show overdue milestones")}
              >
                <Zap className="h-3 w-3 mr-2" />
                Show overdue milestones
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setInputValue("Generate status report")}
              >
                <Zap className="h-3 w-3 mr-2" />
                Generate status report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setInputValue("Check team readiness")}
              >
                <Zap className="h-3 w-3 mr-2" />
                Check team readiness
              </Button>
            </CardContent>
          </Card>

          {/* Response Types */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm">Response Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Bot className="h-4 w-4 text-blue-500" />
                <span>Text analysis & recommendations</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-green-500" />
                <span>Generate reports & documents</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Image className="h-4 w-4 text-purple-500" />
                <span>Create charts & visualizations</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Volume2 className="h-4 w-4 text-orange-500" />
                <span>Voice responses & audio</span>
              </div>
            </CardContent>
          </Card>

          {/* Voice Commands */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm">Voice Commands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">"Show me critical risks"</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">"Create new milestone"</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">"Generate weekly report"</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">"What's my program health?"</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}