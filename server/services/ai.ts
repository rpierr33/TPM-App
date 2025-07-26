import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here"
});

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
}

export const aiService = new AIService();
