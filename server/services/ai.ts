import { storage } from "../storage";
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
} from "../../shared/schema";

const MODEL = "claude-sonnet-4-6";

// Direct Anthropic API via fetch() — drop-in replacement for the SDK
// Avoids SDK bundling/shim issues on Vercel serverless
const anthropic = {
  messages: {
    create: async (opts: { model: string; max_tokens: number; system: string; messages: { role: string; content: string }[] }) => {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: opts.model,
          max_tokens: opts.max_tokens,
          system: opts.system,
          messages: opts.messages,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic API ${res.status}: ${errText}`);
      }

      const data = await res.json() as any;
      return { content: data.content || [{ type: "text", text: "" }] };
    },
  },
};

const TPM_SYSTEM_PROMPT = `You are an expert AI Technical Program Manager (TPM) assistant with deep expertise in:

FRAMEWORKS & METHODOLOGIES:
- PMI/PMBOK (6th & 7th editions): process groups, knowledge areas, predictive vs. adaptive tailoring
- PMP best practices: scope, schedule, cost, quality, resource, communications, risk, procurement, stakeholder management
- Agile/Scrum: sprint planning, velocity, backlog grooming, retrospectives, definition of done
- SAFe (Scaled Agile Framework): PI planning, ARTs, program increments, dependencies across trains
- Kanban: WIP limits, flow metrics, cycle time, throughput
- SDLC phases: Requirements → Architecture → Design → Development → Testing → Deployment → Maintenance

TECHNICAL PROGRAM MANAGEMENT:
- Cross-functional program coordination across engineering, product, design, data, infra, and security
- Dependency management: hard vs. soft dependencies, critical path analysis, float/slack calculation
- Risk management: probability/impact matrices, risk registers, RAID logs, mitigation vs. contingency plans
- OKR and KPI definition, tracking, and reporting cadences
- Stakeholder management: RACI matrices, communication plans, escalation paths
- Milestone planning aligned to SDLC gates and PMI phase deliverables
- Adoption and change management: readiness assessments, training plans, rollout strategies
- Executive reporting: status RAG ratings, variance analysis, forecast vs. actuals

INDUSTRY STANDARDS:
- ISO 21500 project management guidelines
- ITIL for service management integration
- DevOps and CI/CD pipeline considerations in program planning
- SLA/SLO/SLI definitions for technical programs
- Tech debt quantification and prioritization frameworks

Always provide specific, actionable recommendations. When making suggestions, cite the relevant PMI knowledge area, SDLC phase, or Agile ceremony they apply to. Think like a Staff/Principal TPM at a top tech company.`;

function parseJSON(text: string): any {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim());
  // Fallback: extract the first {...} block (handles truncated responses)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text.trim());
}

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
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        system: TPM_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Summarize the following text concisely, preserving key technical details, decisions, risks, and action items:\n\n${text}`
          }
        ]
      });

      return response.content[0].type === "text"
        ? response.content[0].text
        : "Unable to generate summary";
    } catch (error) {
      console.error("Error in AI summarization:", error);
      throw new Error("Failed to summarize text");
    }
  }

  async extractActionItems(text: string): Promise<string[]> {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        system: TPM_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Extract all action items from the following text. Return ONLY a JSON object with an "actions" array of strings. Each action item should be clear, specific, and assigned if possible.\n\n${text}`
          }
        ]
      });

      const text_content = response.content[0].type === "text" ? response.content[0].text : '{"actions": []}';
      const result = parseJSON(text_content);
      return result.actions || [];
    } catch (error) {
      console.error("Error extracting action items:", error);
      throw new Error("Failed to extract action items");
    }
  }

  async calculateRiskScore(riskDescription: string): Promise<number> {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 200,
        system: TPM_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze this risk using the PMI probability/impact matrix and provide a risk score from 1-100 (1=negligible, 100=critical). Return ONLY a JSON object with a "score" field and a brief "rationale" field.\n\nRisk: ${riskDescription}`
          }
        ]
      });

      const text_content = response.content[0].type === "text" ? response.content[0].text : '{"score": 50}';
      const result = parseJSON(text_content);
      return Math.max(1, Math.min(100, result.score));
    } catch (error) {
      console.error("Error calculating risk score:", error);
      return 50;
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

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1000,
        system: TPM_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Using critical path analysis and Monte Carlo-style risk reasoning, predict delay probabilities (0-100) for each milestone and recommend specific PMI-aligned mitigation actions. Return ONLY a JSON object with a "predictions" array where each item has: milestoneId, delayProbability, recommendedActions (array of strings).\n\nProgram data:\n${JSON.stringify(analysisData, null, 2)}`
          }
        ]
      });

      const text_content = response.content[0].type === "text" ? response.content[0].text : '{"predictions": []}';
      const result = parseJSON(text_content);
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
        program: { name: program?.name, status: program?.status },
        risks: risks.map(r => ({ severity: r.severity, status: r.status, title: r.title })),
        adopters: adopters.map(a => ({ teamName: a.teamName, status: a.status, readinessScore: a.readinessScore })),
        milestones: milestones.map(m => ({ title: m.title, status: m.status, dueDate: m.dueDate }))
      };

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1200,
        system: TPM_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze this program and provide insights grounded in PMI and SDLC best practices. Return ONLY a JSON object with three fields:
- riskPrediction: forward-looking risk assessment with specific mitigations
- adopterSupport: adoption readiness analysis with change management recommendations
- programHealth: overall RAG status with specific improvement actions

Program data:\n${JSON.stringify(programData, null, 2)}`
          }
        ]
      });

      const text_content = response.content[0].type === "text" ? response.content[0].text : '{}';
      const result = parseJSON(text_content);
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

      const criticalRisks = risks.filter(r => r.severity === "critical" || r.severity === "high");
      const completedMilestones = milestones.filter(m => m.status === "completed");
      const avgAdopterReadiness = adopters.length > 0
        ? Math.round(adopters.reduce((sum, a) => sum + (a.readinessScore || 0), 0) / adopters.length)
        : 0;
      const ragStatus = criticalRisks.length > 2 ? "Red" : criticalRisks.length > 0 ? "Amber" : "Green";

      // Build report from actual data — no AI JSON generation
      const reportContent = {
        executiveSummary: "",
        ragStatus,
        keyMetrics: {
          totalRisks: risks.length,
          criticalRisks: criticalRisks.length,
          totalMilestones: milestones.length,
          completedMilestones: completedMilestones.length,
          milestoneCompletion: milestones.length > 0 ? Math.round((completedMilestones.length / milestones.length) * 100) : 0,
          adopterReadiness: avgAdopterReadiness,
          adopterCount: adopters.length,
        },
        riskSummary: criticalRisks.slice(0, 5).map(r => ({ title: r.title, severity: r.severity, status: r.status })),
        milestoneProgress: milestones.slice(0, 5).map(m => ({ title: m.title, status: m.status, dueDate: m.dueDate })),
        adopterReadiness: adopters.map(a => ({ name: a.teamName, readiness: a.readinessScore })),
        nextSteps: [] as string[],
      };

      // Quick AI call for just the summary and next steps (short, won't truncate)
      try {
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 500,
          system: TPM_SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Write a 2-3 sentence executive summary and 3 next steps for this ${type} report. Return ONLY raw JSON (no markdown): {"executiveSummary": "...", "nextSteps": ["...", "...", "..."]}\n\nProgram: ${program?.name} (${program?.status})\nRAG: ${ragStatus}\nRisks: ${risks.length} total, ${criticalRisks.length} critical/high\nMilestones: ${completedMilestones.length}/${milestones.length} complete\nAdopters: ${adopters.length} teams, avg readiness ${avgAdopterReadiness}%`
          }]
        });
        const text = response.content[0].type === "text" ? response.content[0].text : '{}';
        const aiParts = parseJSON(text);
        reportContent.executiveSummary = aiParts.executiveSummary || `${type} report for ${program?.name}`;
        reportContent.nextSteps = aiParts.nextSteps || [];
      } catch {
        reportContent.executiveSummary = `${type} report for ${program?.name}. RAG status: ${ragStatus}.`;
      }

      const capType = type.charAt(0).toUpperCase() + type.slice(1);
      const report = await storage.createReport({
        title: `${capType} Report - ${program?.name}`,
        type,
        programId,
        content: reportContent,
        generatedBy: null
      });

      return report;
    } catch (error) {
      console.error("Error generating report:", error);
      throw new Error("Failed to generate report");
    }
  }

  async generatePortfolioReport(type: string): Promise<any> {
    try {
      const allPrograms = await storage.getPrograms();
      const allRisks = await storage.getRisks();
      const allMilestones = await storage.getMilestones();
      const allAdopters = await storage.getAdopters();

      const criticalRisks = allRisks.filter(r => r.severity === "critical" || r.severity === "high");
      const completedMilestones = allMilestones.filter(m => m.status === "completed");
      const avgAdopterReadiness = allAdopters.length > 0
        ? Math.round(allAdopters.reduce((sum, a) => sum + (a.readinessScore || 0), 0) / allAdopters.length)
        : 0;
      const ragStatus = criticalRisks.length > 4 ? "Red" : criticalRisks.length > 0 ? "Amber" : "Green";

      // Per-program breakdown
      const programBreakdowns = allPrograms.map(prog => {
        const progRisks = allRisks.filter(r => r.programId === prog.id);
        const progMilestones = allMilestones.filter(m => m.programId === prog.id);
        const progAdopters = allAdopters.filter(a => a.programId === prog.id);
        const progCritical = progRisks.filter(r => r.severity === "critical" || r.severity === "high");
        const progCompleted = progMilestones.filter(m => m.status === "completed");
        return {
          name: prog.name,
          status: prog.status,
          rag: progCritical.length > 2 ? "Red" : progCritical.length > 0 ? "Amber" : "Green",
          risks: { total: progRisks.length, criticalHigh: progCritical.length },
          milestones: { total: progMilestones.length, completed: progCompleted.length },
          adopters: progAdopters.length,
        };
      });

      const reportContent = {
        executiveSummary: "",
        ragStatus,
        programBreakdowns,
        keyMetrics: {
          totalPrograms: allPrograms.length,
          totalRisks: allRisks.length,
          criticalRisks: criticalRisks.length,
          totalMilestones: allMilestones.length,
          completedMilestones: completedMilestones.length,
          milestoneCompletion: allMilestones.length > 0 ? Math.round((completedMilestones.length / allMilestones.length) * 100) : 0,
          adopterReadiness: avgAdopterReadiness,
          adopterCount: allAdopters.length,
        },
        riskSummary: criticalRisks.slice(0, 5).map(r => ({ title: r.title, severity: r.severity, status: r.status })),
        nextSteps: [] as string[],
      };

      // Quick AI summary
      try {
        const programList = allPrograms.map(p => `${p.name} (${p.status})`).join(", ");
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 500,
          system: TPM_SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Write a 2-3 sentence portfolio executive summary and 3 next steps. Return ONLY raw JSON: {"executiveSummary": "...", "nextSteps": ["...", "...", "..."]}\n\nPrograms: ${programList}\nRAG: ${ragStatus}\nRisks: ${allRisks.length} total, ${criticalRisks.length} critical/high\nMilestones: ${completedMilestones.length}/${allMilestones.length} complete\nAdopters: ${allAdopters.length} teams, avg readiness ${avgAdopterReadiness}%`
          }]
        });
        const text = response.content[0].type === "text" ? response.content[0].text : '{}';
        const aiParts = parseJSON(text);
        reportContent.executiveSummary = aiParts.executiveSummary || "Portfolio overview";
        reportContent.nextSteps = aiParts.nextSteps || [];
      } catch {
        reportContent.executiveSummary = `Portfolio ${type} report across ${allPrograms.length} programs. RAG: ${ragStatus}.`;
      }

      const capType = type.charAt(0).toUpperCase() + type.slice(1);
      const report = await storage.createReport({
        title: `Portfolio ${capType} Report`,
        type,
        programId: null,
        content: reportContent,
        generatedBy: null
      });

      return report;
    } catch (error) {
      console.error("Error generating portfolio report:", error);
      throw new Error("Failed to generate portfolio report");
    }
  }

  async processVoiceCommand(input: string): Promise<VoiceCommandResult> {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        system: TPM_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Parse this voice/text command and extract the intended action. Return ONLY a JSON object with: action, parameters, confidence (0-100), and reasoning.

Available actions:
- create_program: Create a new program
- create_milestone: Add milestone to a program
- create_risk: Add a risk
- create_dependency: Track a dependency
- analyze_program: Analyze program health
- generate_report: Create executive report
- escalate_issue: Create escalation

Example: "Create a new program called API Migration with deadline March 15th"
Returns: {"action": "create_program", "parameters": {"name": "API Migration", "endDate": "2026-03-15"}, "confidence": 95, "reasoning": "Clear create program intent with name and date"}

Command: "${input}"`
          }
        ]
      });

      const text_content = response.content[0].type === "text" ? response.content[0].text : '{}';
      const parsed = parseJSON(text_content);
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
            ownerId: null,
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
              "Want me to suggest a SDLC phase breakdown?"
            ]
          };

        case 'create_milestone':
          const milestone = await storage.createMilestone({
            title: command.parameters.title,
            description: command.parameters.description,
            programId: command.parameters.programId,
            status: 'not_started',
            ownerId: null,
            dueDate: command.parameters.dueDate ? new Date(command.parameters.dueDate) : undefined,
            completedDate: undefined,
            jiraEpicKey: null
          });

          return {
            success: true,
            message: `Added milestone "${milestone.title}" to the program!`,
            data: milestone,
            followUp: [
              "Should I identify potential risks for this milestone?",
              "Want me to check for dependencies?",
              "Need me to align this to a PMI process group?"
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

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: TPM_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Perform a comprehensive program health analysis using PMI knowledge areas and SDLC best practices. Return ONLY a JSON object with four arrays:
- suggestions: Actionable recommendations tied to specific PMI knowledge areas or SDLC phases
- risks: New risks not currently tracked (use RAID log thinking)
- gaps: Missing program components that could cause failure (scope gaps, resource gaps, communication gaps, etc.)
- improvements: Process optimizations using Agile, SAFe, or PMI frameworks

Be specific and cite frameworks where relevant.

Program data:\n${JSON.stringify(programData, null, 2)}`
          }
        ]
      });

      const text_content = response.content[0].type === "text" ? response.content[0].text : '{}';
      const analysis = parseJSON(text_content);

      // Auto-create risks for critical gaps
      if (analysis.risks && analysis.risks.length > 0) {
        for (const riskDescription of analysis.risks.slice(0, 3)) {
          const riskScore = await this.calculateRiskScore(riskDescription);
          await storage.createRisk({
            title: `AI-Identified: ${riskDescription.substring(0, 50)}...`,
            description: riskDescription,
            programId: programId || null,
            severity: riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low',
            probability: Math.max(1, Math.min(5, Math.round(riskScore / 20))),
            impact: Math.max(1, Math.min(5, Math.round((riskScore * 0.8) / 20))),
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
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: `${TPM_SYSTEM_PROMPT}

Current platform context: ${context ? JSON.stringify(context) : 'General TPM conversation'}

RESPONSE STYLE:
- Answer only what was asked. Do not volunteer unrequested data.
- Use clear structure: bullet points (- item), **bold** for key terms, short paragraphs.
- Lead with a 1-2 sentence summary, then supporting details in a list if needed.
- Prefer scannable lists over dense prose paragraphs. Never write a wall of text.
- When giving recommendations, reference the relevant PMI knowledge area, SDLC phase, or Agile framework.
- Ask a clarifying question if the request is genuinely ambiguous.`,
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      });

      return response.content[0].type === "text"
        ? response.content[0].text
        : "I'm not sure how to help with that right now.";
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
        programDetails: programs.map(p => ({ name: p.name, status: p.status })),
        riskDetails: criticalRisks.map(r => ({ title: r.title, severity: r.severity })),
        milestonesThisWeek: upcomingMilestones.map(m => ({ title: m.title, dueDate: m.dueDate }))
      };

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: TPM_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate a concise daily TPM briefing. Return ONLY raw JSON (no markdown, no code fences, no emojis). Keep the summary to 2-3 sentences max.

Format: {"summary": "...", "priorities": ["...", "..."], "alerts": ["..."], "recommendations": ["..."]}

- summary: 2-3 sentence overview of portfolio health (use RAG status: Green/Amber/Red in words, no emojis)
- priorities: Top 3-5 actionable items for today
- alerts: Critical issues only (empty array if none)
- recommendations: 2-3 next steps

Data:\n${JSON.stringify(briefingData, null, 2)}`
          }
        ]
      });

      const text_content = response.content[0].type === "text" ? response.content[0].text : '{}';
      try {
        const parsed = parseJSON(text_content);
        // Clean any emoji artifacts from summary
        if (parsed.summary) {
          parsed.summary = parsed.summary.replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/```[\s\S]*?```/g, '').trim();
        }
        return parsed;
      } catch {
        // JSON parse failed (likely truncated) — extract what we can
        const summaryMatch = text_content.match(/"summary"\s*:\s*"([^"]+)"/);
        const cleanSummary = summaryMatch
          ? summaryMatch[1].replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, '').trim()
          : null;

        if (cleanSummary) {
          // Extract priorities array if available
          const prioritiesMatch = text_content.match(/"priorities"\s*:\s*\[([\s\S]*?)\]/);
          const priorities = prioritiesMatch
            ? prioritiesMatch[1].match(/"([^"]+)"/g)?.map((s: string) => s.replace(/"/g, '')) || []
            : [];
          return { summary: cleanSummary, priorities, alerts: [], recommendations: [] };
        }

        // Complete fallback — no usable JSON at all
        return {
          summary: `Portfolio status: ${programs.length} program${programs.length !== 1 ? 's' : ''} in planning with ${criticalRisks.length} critical/high risks requiring attention.`,
          priorities: criticalRisks.length > 0 ? [`Review ${criticalRisks.length} critical/high risks across programs`] : [],
          alerts: criticalRisks.length > 0 ? [`${criticalRisks.length} critical/high risks need attention`] : [],
          recommendations: []
        };
      }
    } catch (error) {
      console.error("Daily briefing error:", error);
      // Generate a data-driven fallback without AI
      const programs = await storage.getPrograms().catch(() => []);
      const risks = await storage.getRisks().catch(() => []);
      const milestones = await storage.getMilestones().catch(() => []);
      const today = new Date();
      const oneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const overdue = milestones.filter(m => m.dueDate && new Date(m.dueDate) < today && m.status !== 'completed');
      const upcoming = milestones.filter(m => m.dueDate && new Date(m.dueDate) >= today && new Date(m.dueDate) <= oneWeek && m.status !== 'completed');
      const critical = risks.filter(r => r.severity === 'critical' || r.severity === 'high');

      const priorities: string[] = [];
      if (overdue.length > 0) priorities.push(`${overdue.length} overdue milestone${overdue.length > 1 ? 's' : ''} need immediate attention`);
      if (critical.length > 0) priorities.push(`${critical.length} critical/high risk${critical.length > 1 ? 's' : ''} to review`);
      if (upcoming.length > 0) priorities.push(`${upcoming.length} milestone${upcoming.length > 1 ? 's' : ''} due this week`);

      return {
        summary: `You have ${programs.length} program${programs.length !== 1 ? 's' : ''} with ${overdue.length} overdue item${overdue.length !== 1 ? 's' : ''}, ${critical.length} critical risk${critical.length !== 1 ? 's' : ''}, and ${upcoming.length} milestone${upcoming.length !== 1 ? 's' : ''} due this week.`,
        priorities,
        alerts: overdue.length > 0 ? [`${overdue.length} overdue milestone${overdue.length > 1 ? 's' : ''} — address these first`] : [],
        recommendations: []
      };
    }
  }
}

export const aiService = new AIService();
