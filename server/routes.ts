import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProgramSchema,
  insertMilestoneSchema,
  insertRiskSchema,
  insertDependencySchema,
  insertAdopterSchema,
  insertEscalationSchema,
  insertIntegrationSchema,
  insertReportSchema
} from "@shared/schema";
import { aiService } from "./services/ai";
import { integrationService } from "./services/integrations";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Program routes
  app.get("/api/programs", async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  app.get("/api/programs/:id", async (req, res) => {
    try {
      const program = await storage.getProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      console.error("Error fetching program:", error);
      res.status(500).json({ message: "Failed to fetch program" });
    }
  });

  app.post("/api/programs", async (req, res) => {
    try {
      const validatedData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(validatedData);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(400).json({ message: "Failed to create program" });
    }
  });

  app.put("/api/programs/:id", async (req, res) => {
    try {
      const validatedData = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(req.params.id, validatedData);
      res.json(program);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(400).json({ message: "Failed to update program" });
    }
  });

  app.delete("/api/programs/:id", async (req, res) => {
    try {
      await storage.deleteProgram(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ message: "Failed to delete program" });
    }
  });

  // Milestone routes
  app.get("/api/milestones", async (req, res) => {
    try {
      const { programId } = req.query;
      const milestones = await storage.getMilestones(programId as string);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones", async (req, res) => {
    try {
      const validatedData = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(validatedData);
      
      // If Live mode and JIRA integration is configured, push to JIRA
      if (req.body.pushToJira) {
        try {
          const jiraEpicKey = await integrationService.pushMilestoneToJira(milestone);
          await storage.updateMilestone(milestone.id, { jiraEpicKey });
        } catch (jiraError) {
          console.error("Error pushing milestone to JIRA:", jiraError);
        }
      }
      
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(400).json({ message: "Failed to create milestone" });
    }
  });

  // Risk routes
  app.get("/api/risks", async (req, res) => {
    try {
      const { programId } = req.query;
      const risks = await storage.getRisks(programId as string);
      res.json(risks);
    } catch (error) {
      console.error("Error fetching risks:", error);
      res.status(500).json({ message: "Failed to fetch risks" });
    }
  });

  app.post("/api/risks", async (req, res) => {
    try {
      const validatedData = insertRiskSchema.parse(req.body);
      
      // Calculate AI risk score
      if (validatedData.description) {
        try {
          const aiScore = await aiService.calculateRiskScore(validatedData.description);
          validatedData.aiScore = aiScore.toString();
        } catch (aiError) {
          console.error("Error calculating AI risk score:", aiError);
        }
      }
      
      const risk = await storage.createRisk(validatedData);
      
      // If Live mode and JIRA integration is configured, push to JIRA
      if (req.body.pushToJira) {
        try {
          const jiraIssueKey = await integrationService.pushRiskToJira(risk);
          await storage.updateRisk(risk.id, { jiraIssueKey });
        } catch (jiraError) {
          console.error("Error pushing risk to JIRA:", jiraError);
        }
      }
      
      res.status(201).json(risk);
    } catch (error) {
      console.error("Error creating risk:", error);
      res.status(400).json({ message: "Failed to create risk" });
    }
  });

  // Dependency routes
  app.get("/api/dependencies", async (req, res) => {
    try {
      const { programId } = req.query;
      const dependencies = await storage.getDependencies(programId as string);
      res.json(dependencies);
    } catch (error) {
      console.error("Error fetching dependencies:", error);
      res.status(500).json({ message: "Failed to fetch dependencies" });
    }
  });

  app.post("/api/dependencies", async (req, res) => {
    try {
      const validatedData = insertDependencySchema.parse(req.body);
      const dependency = await storage.createDependency(validatedData);
      res.status(201).json(dependency);
    } catch (error) {
      console.error("Error creating dependency:", error);
      res.status(400).json({ message: "Failed to create dependency" });
    }
  });

  // Adopter routes
  app.get("/api/adopters", async (req, res) => {
    try {
      const { programId } = req.query;
      const adopters = await storage.getAdopters(programId as string);
      res.json(adopters);
    } catch (error) {
      console.error("Error fetching adopters:", error);
      res.status(500).json({ message: "Failed to fetch adopters" });
    }
  });

  app.post("/api/adopters", async (req, res) => {
    try {
      const validatedData = insertAdopterSchema.parse(req.body);
      const adopter = await storage.createAdopter(validatedData);
      res.status(201).json(adopter);
    } catch (error) {
      console.error("Error creating adopter:", error);
      res.status(400).json({ message: "Failed to create adopter" });
    }
  });

  // Escalation routes
  app.get("/api/escalations", async (req, res) => {
    try {
      const { programId } = req.query;
      const escalations = await storage.getEscalations(programId as string);
      res.json(escalations);
    } catch (error) {
      console.error("Error fetching escalations:", error);
      res.status(500).json({ message: "Failed to fetch escalations" });
    }
  });

  app.post("/api/escalations", async (req, res) => {
    try {
      const validatedData = insertEscalationSchema.parse(req.body);
      const escalation = await storage.createEscalation(validatedData);
      
      // Send escalation to configured channels
      if (escalation.sendToSlack || escalation.sendToTeams || escalation.sendToEmail) {
        try {
          await integrationService.sendEscalation(escalation);
        } catch (sendError) {
          console.error("Error sending escalation:", sendError);
        }
      }
      
      res.status(201).json(escalation);
    } catch (error) {
      console.error("Error creating escalation:", error);
      res.status(400).json({ message: "Failed to create escalation" });
    }
  });

  // Integration routes
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations", async (req, res) => {
    try {
      const validatedData = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration(validatedData);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(400).json({ message: "Failed to create integration" });
    }
  });

  app.put("/api/integrations/:name", async (req, res) => {
    try {
      const validatedData = insertIntegrationSchema.partial().parse(req.body);
      const integration = await storage.updateIntegration(req.params.name, validatedData);
      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(400).json({ message: "Failed to update integration" });
    }
  });

  // AI routes
  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const summary = await aiService.summarizeText(text);
      res.json({ summary });
    } catch (error) {
      console.error("Error summarizing text:", error);
      res.status(500).json({ message: "Failed to summarize text" });
    }
  });

  app.post("/api/ai/extract-actions", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const actions = await aiService.extractActionItems(text);
      res.json({ actions });
    } catch (error) {
      console.error("Error extracting action items:", error);
      res.status(500).json({ message: "Failed to extract action items" });
    }
  });

  app.post("/api/ai/predict-delays", async (req, res) => {
    try {
      const { programId } = req.body;
      if (!programId) {
        return res.status(400).json({ message: "Program ID is required" });
      }
      
      const predictions = await aiService.predictMilestoneDelays(programId);
      res.json(predictions);
    } catch (error) {
      console.error("Error predicting delays:", error);
      res.status(500).json({ message: "Failed to predict delays" });
    }
  });

  // AI-FIRST routes for voice and chat interface
  app.post("/api/ai/voice-command", async (req, res) => {
    try {
      const { input } = req.body;
      const result = await aiService.processVoiceCommand(input);
      res.json(result);
    } catch (error) {
      console.error("Error processing voice command:", error);
      res.status(500).json({ message: "Failed to process voice command" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      const response = await aiService.chatWithAI(message, context);
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/ai/daily-briefing", async (req, res) => {
    try {
      const briefing = await aiService.generateDailyBriefing();
      res.json(briefing);
    } catch (error) {
      console.error("Error generating daily briefing:", error);
      res.status(500).json({ message: "Failed to generate briefing" });
    }
  });

  app.post("/api/ai/analyze-program", async (req, res) => {
    try {
      const { programId } = req.body;
      const analysis = await aiService.analyzeProgram(programId);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing program:", error);
      res.status(500).json({ message: "Failed to analyze program" });
    }
  });

  // Reports routes
  app.get("/api/reports", async (req, res) => {
    try {
      const { programId } = req.query;
      const reports = await storage.getReports(programId as string);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { programId, type } = req.body;
      const report = await aiService.generateReport(programId, type);
      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle WebSocket messages for real-time updates
        console.log('Received WebSocket message:', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
