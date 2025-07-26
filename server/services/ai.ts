import OpenAI from "openai";
import { storage } from "../storage";
import { v4 as uuidv4 } from "uuid";
import type { 
  Program, 
  Milestone, 
  Risk, 
  Dependency, 
  Adopter,
  Escalation,
  InsertProgram,
  InsertMilestone,
  InsertRisk,
  InsertDependency,
  InsertAdopter,
  InsertEscalation
} from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here"
});

export interface AICommand {
  action: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface AIAnalysis {
  suggestions: string[];
  risks: string[];
  gaps: string[];
  improvements: string[];
}

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  data?: any;
  followUp?: string[];
}

export class AIService {
  async summarizeText(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a technical program manager assistant. Summarize the following text concisely while maintaining key technical details and action items."
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content || "Unable to generate summary";
    } catch (error) {
      console.error("Error in AI summarization:", error);
      throw new Error("Failed to summarize text");
    }
  }

  async extractActionItems(text: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a technical program manager assistant. Extract action items from the following text. Return the response as a JSON array of strings. Each action item should be clear and actionable."
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{"actions": []}');
      return result.actions || [];
    } catch (error) {
      console.error("Error extracting action items:", error);
      throw new Error("Failed to extract action items");
    }
  }

  async calculateRiskScore(riskDescription: string): Promise<number> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a risk assessment expert. Analyze the following risk description and provide a risk score from 1-100 based on potential impact and likelihood. Return the response as JSON with a 'score' field."
          },
          {
            role: "user",
            content: riskDescription
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 100
      });

      const result = JSON.parse(response.choices[0].message.content || '{"score": 50}');
      return Math.max(1, Math.min(100, result.score));
    } catch (error) {
      console.error("Error calculating risk score:", error);
      return 50; // Default moderate risk score
    }
  }

  async predictMilestoneDelays(programId: string): Promise<{
    milestoneId: string;
    delayProbability: number;
    recommendedActions: string[];
  }[]> {
    try {
      const milestones = await storage.getMilestones(programId);
      const risks = await storage.getRisks(programId);
      const dependencies = await storage.getDependencies(programId);

      const analysisData = {
        milestones: milestones.map(m => ({
          id: m.id,
          title: m.title,
          status: m.status,
          dueDate: m.dueDate
        })),
        risks: risks.map(r => ({
          severity: r.severity,
          status: r.status,
          impact: r.impact
        })),
        dependencies: dependencies.map(d => ({
          status: d.status
        }))
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a technical program manager AI assistant. Analyze the program data and predict milestone delay probabilities (0-100) and recommend specific actions. Return JSON with an array of predictions."
          },
          {
            role: "user",
            content: `Analyze this program data and predict delays: ${JSON.stringify(analysisData)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{"predictions": []}');
      return result.predictions || [];
    } catch (error) {
      console.error("Error predicting milestone delays:", error);
      throw new Error("Failed to predict milestone delays");
    }
  }

  async generateInsights(programId: string): Promise<{
    riskPrediction: string;
    adopterSupport: string;
    programHealth: string;
  }> {
    try {
      const program = await storage.getProgram(programId);
      const risks = await storage.getRisks(programId);
      const adopters = await storage.getAdopters(programId);
      const milestones = await storage.getMilestones(programId);

      const programData = {
        program: {
          name: program?.name,
          status: program?.status
        },
        risks: risks.map(r => ({
          severity: r.severity,
          status: r.status,
          title: r.title
        })),
        adopters: adopters.map(a => ({
          teamName: a.teamName,
          status: a.status,
          readinessScore: a.readinessScore
        })),
        milestones: milestones.map(m => ({
          title: m.title,
          status: m.status,
          dueDate: m.dueDate
        }))
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior technical program manager AI assistant. Analyze the program data and provide insights on risk prediction, adopter support needs, and overall program health. Return JSON with riskPrediction, adopterSupport, and programHealth fields."
          },
          {
            role: "user",
            content: `Analyze this program data: ${JSON.stringify(programData)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        riskPrediction: result.riskPrediction || "No risk analysis available",
        adopterSupport: result.adopterSupport || "No adopter analysis available",
        programHealth: result.programHealth || "Program health analysis unavailable"
      };
    } catch (error) {
      console.error("Error generating AI insights:", error);
      throw new Error("Failed to generate AI insights");
    }
  }

  async generateReport(programId: string, type: string): Promise<any> {
    try {
      const program = await storage.getProgram(programId);
      const risks = await storage.getRisks(programId);
      const milestones = await storage.getMilestones(programId);
      const adopters = await storage.getAdopters(programId);

      const reportData = {
        program,
        risks,
        milestones,
        adopters,
        type
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a technical program manager assistant. Generate a comprehensive ${type} report based on the program data. Include executive summary, key metrics, risk assessment, milestone progress, and recommendations.`
          },
          {
            role: "user",
            content: `Generate a ${type} report for this program data: ${JSON.stringify(reportData)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      const reportContent = JSON.parse(response.choices[0].message.content || '{}');
      
      // Save the generated report
      const report = await storage.createReport({
        title: `${type} Report - ${program?.name}`,
        type,
        programId,
        content: reportContent,
        generatedBy: "ai-system" // In a real app, this would be the current user ID
      });

      return report;
    } catch (error) {
      console.error("Error generating report:", error);
      throw new Error("Failed to generate report");
    }
  }

  // AI-FIRST FEATURES - Voice & Chat Interface

  async processVoiceCommand(input: string): Promise<VoiceCommandResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI-first Technical Program Manager assistant. Parse voice/text commands and extract actionable instructions.

Available actions:
- create_program: Create a new program
- create_milestone: Add milestone to a program
- create_risk: Add a risk
- create_dependency: Track a dependency
- analyze_program: Analyze program health
- generate_report: Create executive report
- escalate_issue: Create escalation

Return JSON with: action, parameters, confidence (0-100), and reasoning.

Example: "Create a new program called API Migration with deadline March 15th"
Should return: {"action": "create_program", "parameters": {"name": "API Migration", "endDate": "2024-03-15"}, "confidence": 95}`
          },
          {
            role: "user",
            content: input
          }
        ],
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(response.choices[0].message.content || '{}');
      return await this.executeVoiceCommand(parsed);
    } catch (error) {
      console.error("Voice command processing error:", error);
      return {
        success: false,
        message: "I couldn't understand that command. Try saying something like 'Create a new program called API Migration'"
      };
    }
  }

  private async executeVoiceCommand(command: AICommand): Promise<VoiceCommandResult> {
    try {
      switch (command.action) {
        case 'create_program':
          const program = await storage.createProgram({
            name: command.parameters.name,
            description: command.parameters.description || `AI-created program: ${command.parameters.name}`,
            status: 'planning',
            ownerId: null, // Set based on authenticated user
            startDate: command.parameters.startDate ? new Date(command.parameters.startDate) : new Date(),
            endDate: command.parameters.endDate ? new Date(command.parameters.endDate) : null,
            objectives: command.parameters.objectives || null,
            kpis: command.parameters.kpis || null
          });
          
          return {
            success: true,
            message: `Created program "${program.name}" successfully!`,
            data: program,
            followUp: [
              "Would you like to add milestones to this program?",
              "Should I analyze potential risks for this program?",
              "Want me to suggest team assignments?"
            ]
          };

        case 'create_milestone':
          const milestone = await storage.createMilestone({
            title: command.parameters.title,
            description: command.parameters.description,
            programId: command.parameters.programId,
            status: 'not_started',
            ownerId: null,
            dueDate: command.parameters.dueDate ? new Date(command.parameters.dueDate) : null,
            completedDate: null,
            jiraEpicKey: null
          });

          return {
            success: true,
            message: `Added milestone "${milestone.title}" to the program!`,
            data: milestone,
            followUp: [
              "Should I identify potential risks for this milestone?",
              "Want me to check for dependencies?",
              "Need me to estimate the timeline?"
            ]
          };

        case 'analyze_program':
          const analysis = await this.analyzeProgram(command.parameters.programId);
          return {
            success: true,
            message: "Here's my analysis of your program:",
            data: analysis,
            followUp: [
              "Should I create tasks for the identified gaps?",
              "Want me to escalate any critical risks?",
              "Need a detailed report for stakeholders?"
            ]
          };

        default:
          return {
            success: false,
            message: `I don't know how to ${command.action} yet. I'm learning new commands!`
          };
      }
    } catch (error) {
      console.error("Command execution error:", error);
      return {
        success: false,
        message: "Something went wrong executing that command. Let me try to help another way."
      };
    }
  }

  async analyzeProgram(programId?: string): Promise<AIAnalysis> {
    try {
      // Get all program data
      const programs = programId ? [await storage.getProgram(programId)] : await storage.getPrograms();
      const milestones = await storage.getMilestones(programId);
      const risks = await storage.getRisks(programId);
      const dependencies = await storage.getDependencies(programId);
      const adopters = await storage.getAdopters(programId);

      const programData = {
        programs: programs.filter(Boolean),
        milestones,
        risks,
        dependencies,
        adopters
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior Technical Program Manager AI analyzing program health. 

Analyze the program data and provide:
1. SUGGESTIONS: Actionable recommendations to improve the program
2. RISKS: Potential risks that should be tracked (missing from current risks)
3. GAPS: Missing components or information that could cause problems
4. IMPROVEMENTS: Specific ways to optimize processes and outcomes

Focus on:
- Timeline feasibility and resource allocation
- Missing dependencies or blockers
- Team readiness and adoption challenges
- Communication and stakeholder alignment
- Technical debt and integration risks

Return JSON with arrays of specific, actionable insights.`
          },
          {
            role: "user",
            content: `Analyze this program data: ${JSON.stringify(programData, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Auto-create risks for critical gaps
      if (analysis.risks && analysis.risks.length > 0) {
        for (const riskDescription of analysis.risks.slice(0, 3)) { // Limit to top 3
          const riskScore = await this.calculateRiskScore(riskDescription);
          await storage.createRisk({
            title: `AI-Identified: ${riskDescription.substring(0, 50)}...`,
            description: riskDescription,
            programId: programId || null,
            severity: riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low',
            probability: Math.round(riskScore),
            impact: Math.round(riskScore * 0.8),
            status: 'identified',
            ownerId: null,
            mitigationPlan: `AI Suggestion: ${riskDescription}`,
            jiraIssueKey: null
          });
        }
      }

      return {
        suggestions: analysis.suggestions || [],
        risks: analysis.risks || [],
        gaps: analysis.gaps || [],
        improvements: analysis.improvements || []
      };
    } catch (error) {
      console.error("Program analysis error:", error);
      return {
        suggestions: ["Unable to analyze program at this time"],
        risks: [],
        gaps: [],
        improvements: []
      };
    }
  }

  async chatWithAI(message: string, context?: any): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI-first Technical Program Manager assistant. You help manage engineering programs through conversation.

You can:
- Answer questions about programs, milestones, risks, and dependencies
- Provide advice on program management best practices
- Suggest improvements and identify gaps
- Help create and manage program artifacts
- Escalate issues when needed

Keep responses concise but helpful. Ask clarifying questions when needed. Always think like a senior TPM.

Current context: ${context ? JSON.stringify(context) : 'General conversation'}`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content || "I'm not sure how to help with that right now.";
    } catch (error) {
      console.error("Chat error:", error);
      return "I'm having trouble processing that right now. Could you try rephrasing?";
    }
  }

  async generateDailyBriefing(): Promise<{
    summary: string;
    priorities: string[];
    alerts: string[];
    recommendations: string[];
  }> {
    try {
      // Get current program state
      const programs = await storage.getPrograms();
      const risks = await storage.getRisks();
      const milestones = await storage.getMilestones();
      
      const today = new Date();
      const oneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcomingMilestones = milestones.filter(m => 
        m.dueDate && new Date(m.dueDate) <= oneWeek && new Date(m.dueDate) >= today
      );
      
      const criticalRisks = risks.filter(r => 
        r.severity === 'critical' || r.severity === 'high'
      );

      const briefingData = {
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p.status === 'active').length,
        upcomingMilestones: upcomingMilestones.length,
        criticalRisks: criticalRisks.length,
        programDetails: programs.map(p => ({
          name: p.name,
          status: p.status
        })),
        riskDetails: criticalRisks.map(r => ({
          title: r.title,
          severity: r.severity
        }))
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI TPM assistant creating a daily briefing. Provide a concise summary, top priorities, critical alerts, and actionable recommendations.

Return JSON with:
- summary: Brief overview of current state
- priorities: Top 3-5 things to focus on today
- alerts: Critical issues requiring immediate attention
- recommendations: Specific actions to improve program health`
          },
          {
            role: "user",
            content: `Create daily briefing for: ${JSON.stringify(briefingData)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Daily briefing error:", error);
      return {
        summary: "Unable to generate briefing at this time",
        priorities: [],
        alerts: [],
        recommendations: []
      };
    }
  }
}

export const aiService = new AIService();
