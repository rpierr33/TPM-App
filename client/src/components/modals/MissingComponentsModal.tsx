import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Plus, 
  CheckCircle, 
  Calendar, 
  Target, 
  Users, 
  TrendingUp,
  FileText,
  MessageSquare,
  Link,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import type { Program } from "@shared/schema";

interface MissingComponent {
  type: 'milestone' | 'risk' | 'dependency' | 'adopter' | 'objective';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  actionLabel: string;
  navigateTo: string;
}

interface MissingComponentsModalProps {
  open: boolean;
  onClose: () => void;
  program: Program;
  analysis: {
    riskAlerts?: string[];
    completenessScore?: number;
    missingComponents?: MissingComponent[];
  };
}

export function MissingComponentsModal({ 
  open, 
  onClose, 
  program, 
  analysis 
}: MissingComponentsModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Convert API risk alerts to missing components format
  const convertRiskAlertsToComponents = (riskAlerts: any[]): MissingComponent[] => {
    return riskAlerts.map((alert) => {
      let navigateTo = '/programs';
      let actionLabel = 'Add Component';
      
      // Map component types to navigation
      if (alert.title.includes('Milestone')) {
        navigateTo = '/milestones';
        actionLabel = 'Add Milestones';
      } else if (alert.title.includes('Risk')) {
        navigateTo = '/risk-management';
        actionLabel = 'Add Risks';
      } else if (alert.title.includes('Dependencies')) {
        navigateTo = '/dependencies';
        actionLabel = 'Map Dependencies';
      } else if (alert.title.includes('Adopter')) {
        navigateTo = '/adopter-support';
        actionLabel = 'Plan Adoption';
      } else if (alert.title.includes('Projects')) {
        navigateTo = '/program-planning';
        actionLabel = 'Define Projects';
      }

      return {
        type: alert.title.includes('Milestone') ? 'milestone' :
              alert.title.includes('Risk') ? 'risk' :
              alert.title.includes('Dependencies') ? 'dependency' :
              alert.title.includes('Adopter') ? 'adopter' : 'objective',
        title: alert.title,
        description: alert.description,
        severity: alert.severity as 'high' | 'medium' | 'low',
        suggestion: alert.recommendation,
        actionLabel,
        navigateTo
      };
    });
  };

  const missingComponents = analysis.riskAlerts ? 
    convertRiskAlertsToComponents(analysis.riskAlerts) : [];
  const completenessScore = analysis.completenessScore || 20;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Calendar className="h-5 w-5" />;
      case 'risk': return <AlertTriangle className="h-5 w-5" />;
      case 'dependency': return <Link className="h-5 w-5" />;
      case 'adopter': return <Users className="h-5 w-5" />;
      case 'objective': return <Target className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const handleAddComponent = (component: MissingComponent) => {
    toast({
      title: "Navigating to Component",
      description: `Opening ${component.actionLabel} for ${program.name}`,
    });
    
    // Navigate to the appropriate page with program context
    setLocation(`${component.navigateTo}?programId=${program.id}&fromAnalysis=true`);
    onClose();
  };

  const handleAddAllComponents = () => {
    toast({
      title: "Bulk Component Setup",
      description: "Starting guided setup for all missing components",
    });
    // Start with the highest priority component
    const highPriorityComponent = missingComponents.find(c => c.severity === 'high') || missingComponents[0];
    handleAddComponent(highPriorityComponent);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            Program Analysis: {program.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Program Completeness Score */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Program Completeness Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={completenessScore} className="flex-1" />
                <Badge variant={completenessScore > 50 ? "default" : "destructive"} className="text-lg px-3 py-1">
                  {completenessScore}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {completenessScore < 30 
                  ? "Critical: Program needs immediate attention to essential components"
                  : completenessScore < 60 
                  ? "Moderate: Several important components are missing"
                  : "Good: Program is well-structured with minor gaps"
                }
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleAddAllComponents} 
              className="flex items-center gap-2"
              size="lg"
            >
              <CheckCircle className="h-4 w-4" />
              Setup All Components
            </Button>
            <Button variant="outline" onClick={onClose}>
              Review Later
            </Button>
          </div>

          <Separator />

          {/* Missing Components List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Missing Components ({missingComponents.length})
            </h3>

            {missingComponents.map((component, index) => (
              <Card key={index} className={`border-l-4 ${getSeverityColor(component.severity)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(component.type)}
                      <div>
                        <CardTitle className="text-base">{component.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSeverityColor(component.severity)}`}
                          >
                            {getSeverityIcon(component.severity)}
                            {component.severity.toUpperCase()} PRIORITY
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleAddComponent(component)}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                      {component.actionLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{component.description}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Suggestion:</strong> {component.suggestion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Footer */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4" />
                <span>
                  Completing these components will improve your program completeness score to approximately{" "}
                  <strong>{Math.min(completenessScore + (missingComponents.length * 16), 100)}%</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}