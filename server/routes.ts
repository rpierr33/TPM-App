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
  insertReportSchema,
  type Program
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

  // Direct program analysis (no AI required)
  app.post("/api/analyze-program", async (req, res) => {
    try {
      const { programId } = req.body;
      
      // If no programId provided, analyze all programs
      let programs: Program[];
      if (programId) {
        const program = await storage.getProgram(programId);
        programs = program ? [program] : [];
      } else {
        programs = await storage.getPrograms();
      }
      const results = [];

      for (const program of programs) {
        // Get all related components
        const milestones = await storage.getMilestones(program.id);
        const risks = await storage.getRisks(program.id);
        const dependencies = await storage.getDependencies(program.id);
        const adopters = await storage.getAdopters(program.id);
        const projects = await storage.getProjects(program.id);

        // Identify missing components and create risk alerts
        const missingComponents = [];
        const riskAlerts = [];

        if (milestones.length === 0) {
          missingComponents.push("milestones");
          riskAlerts.push({
            type: "missing_component",
            severity: "high",
            title: "No Milestones Defined",
            description: `Program "${program.name}" has no milestones, making it impossible to track progress and deadlines.`,
            recommendation: "Define key milestones with dates to establish clear deliverables and timeline expectations."
          });
        }

        if (risks.length === 0) {
          missingComponents.push("risks");
          riskAlerts.push({
            type: "missing_component", 
            severity: "high",
            title: "No Risk Assessment",
            description: `Program "${program.name}" has no identified risks, leaving potential issues unmanaged.`,
            recommendation: "Conduct risk assessment to identify, analyze, and plan mitigation strategies for potential program threats."
          });
        }

        if (dependencies.length === 0) {
          missingComponents.push("dependencies");
          riskAlerts.push({
            type: "missing_component",
            severity: "medium", 
            title: "No Dependencies Tracked",
            description: `Program "${program.name}" has no documented dependencies, which could lead to coordination issues.`,
            recommendation: "Identify and document dependencies between teams, systems, and external factors."
          });
        }

        if (adopters.length === 0) {
          missingComponents.push("adopters");
          riskAlerts.push({
            type: "missing_component",
            severity: "medium",
            title: "No Adopter Tracking",
            description: `Program "${program.name}" has no adopter readiness tracking, risking poor change management.`,
            recommendation: "Define adopter teams and track their readiness to ensure successful program adoption."
          });
        }

        if (projects.length === 0) {
          missingComponents.push("projects");
          riskAlerts.push({
            type: "missing_component",
            severity: "high",
            title: "No Projects Defined", 
            description: `Program "${program.name}" has no projects, making execution unclear.`,
            recommendation: "Break down the program into specific projects with defined scope and deliverables."
          });
        }

        results.push({
          programId: program.id,
          programName: program.name,
          missingComponents,
          riskAlerts,
          completenessScore: Math.round(((5 - missingComponents.length) / 5) * 100)
        });
      }

      res.json({
        analysis: results,
        summary: `Analyzed ${results.length} program(s). Found ${results.reduce((sum, r) => sum + r.riskAlerts.length, 0)} risk alerts for missing components.`
      });
    } catch (error) {
      console.error("Error analyzing program:", error);
      res.status(500).json({ message: "Failed to analyze program" });
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

  // Enhanced milestone routes with contextual data
  app.get("/api/milestones/:id/context", async (req, res) => {
    try {
      const milestone = await storage.getMilestone(req.params.id);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }

      const program = milestone.programId ? await storage.getProgram(milestone.programId) : null;
      const programRisks = program ? await storage.getRisks(program.id) : [];
      const programDependencies = program ? await storage.getDependencies(program.id) : [];
      const programAdopters = program ? await storage.getAdopters(program.id) : [];
      const programMilestones = program ? await storage.getMilestones(program.id) : [];
      const programProjects = program ? await storage.getProjects(program.id) : [];

      res.json({
        milestone,
        program,
        relatedComponents: {
          risks: programRisks,
          dependencies: programDependencies,
          adopters: programAdopters,
          milestones: programMilestones.filter(m => m.id !== milestone.id),
          projects: programProjects
        },
        analytics: {
          riskCount: programRisks.length,
          criticalRisks: programRisks.filter(r => r.severity === 'critical').length,
          dependencyCount: programDependencies.length,
          blockedDependencies: programDependencies.filter(d => d.status === 'blocked').length,
          adopterCount: programAdopters.length,
          readyAdopters: programAdopters.filter(a => a.status === 'ready').length,
        }
      });
    } catch (error) {
      console.error("Error fetching milestone context:", error);
      res.status(500).json({ message: "Failed to fetch milestone context" });
    }
  });

  // Enhanced risk routes with contextual data
  app.get("/api/risks/:id/context", async (req, res) => {
    try {
      const risk = await storage.getRisk(req.params.id);
      if (!risk) {
        return res.status(404).json({ message: "Risk not found" });
      }

      const program = risk.programId ? await storage.getProgram(risk.programId) : null;
      const programMilestones = program ? await storage.getMilestones(program.id) : [];
      const programRisks = program ? await storage.getRisks(program.id) : [];
      const programDependencies = program ? await storage.getDependencies(program.id) : [];
      const programAdopters = program ? await storage.getAdopters(program.id) : [];

      res.json({
        risk,
        program,
        relatedComponents: {
          milestones: programMilestones,
          risks: programRisks.filter(r => r.id !== risk.id),
          dependencies: programDependencies,
          adopters: programAdopters
        },
        analytics: {
          milestoneCount: programMilestones.length,
          overdueMilestones: programMilestones.filter(m => m.dueDate && new Date(m.dueDate) < new Date()).length,
          dependencyCount: programDependencies.length,
          adopterCount: programAdopters.length,
        }
      });
    } catch (error) {
      console.error("Error fetching risk context:", error);
      res.status(500).json({ message: "Failed to fetch risk context" });
    }
  });

  // Enhanced dependency routes with contextual data
  app.get("/api/dependencies/:id/context", async (req, res) => {
    try {
      const dependency = await storage.getDependency(req.params.id);
      if (!dependency) {
        return res.status(404).json({ message: "Dependency not found" });
      }

      const program = dependency.programId ? await storage.getProgram(dependency.programId) : null;
      const programMilestones = program ? await storage.getMilestones(program.id) : [];
      const programRisks = program ? await storage.getRisks(program.id) : [];
      const programDependencies = program ? await storage.getDependencies(program.id) : [];
      const programAdopters = program ? await storage.getAdopters(program.id) : [];

      res.json({
        dependency,
        program,
        relatedComponents: {
          milestones: programMilestones,
          risks: programRisks,
          dependencies: programDependencies.filter(d => d.id !== dependency.id),
          adopters: programAdopters
        },
        analytics: {
          milestoneCount: programMilestones.length,
          riskCount: programRisks.length,
          adopterCount: programAdopters.length,
        }
      });
    } catch (error) {
      console.error("Error fetching dependency context:", error);
      res.status(500).json({ message: "Failed to fetch dependency context" });
    }
  });

  // Enhanced adopter routes with contextual data
  app.get("/api/adopters/:id/context", async (req, res) => {
    try {
      const adopter = await storage.getAdopter(req.params.id);
      if (!adopter) {
        return res.status(404).json({ message: "Adopter not found" });
      }

      const program = adopter.programId ? await storage.getProgram(adopter.programId) : null;
      const programMilestones = program ? await storage.getMilestones(program.id) : [];
      const programRisks = program ? await storage.getRisks(program.id) : [];
      const programDependencies = program ? await storage.getDependencies(program.id) : [];
      const programAdopters = program ? await storage.getAdopters(program.id) : [];

      res.json({
        adopter,
        program,
        relatedComponents: {
          milestones: programMilestones,
          risks: programRisks,
          dependencies: programDependencies,
          adopters: programAdopters.filter(a => a.id !== adopter.id)
        },
        analytics: {
          milestoneCount: programMilestones.length,
          riskCount: programRisks.length,
          dependencyCount: programDependencies.length,
        }
      });
    } catch (error) {
      console.error("Error fetching adopter context:", error);
      res.status(500).json({ message: "Failed to fetch adopter context" });
    }
  });

  // Initiative routes
  app.get("/api/initiatives", async (req, res) => {
    try {
      const initiatives = await storage.getInitiatives();
      res.json(initiatives);
    } catch (error) {
      console.error("Error fetching initiatives:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  app.post("/api/initiatives", async (req, res) => {
    try {
      const initiative = await storage.createInitiative(req.body);
      res.json(initiative);
    } catch (error) {
      console.error("Error creating initiative:", error);
      res.status(500).json({ message: "Failed to create initiative" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const { programId } = req.query;
      const projects = await storage.getProjects(programId as string);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const project = await storage.createProject(req.body);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Stakeholder routes
  app.get("/api/stakeholders", async (req, res) => {
    try {
      const stakeholders = await storage.getStakeholders();
      res.json(stakeholders);
    } catch (error) {
      console.error("Error fetching stakeholders:", error);
      res.status(500).json({ message: "Failed to fetch stakeholders" });
    }
  });

  app.post("/api/stakeholders", async (req, res) => {
    try {
      const stakeholder = await storage.createStakeholder(req.body);
      res.json(stakeholder);
    } catch (error) {
      console.error("Error creating stakeholder:", error);
      res.status(500).json({ message: "Failed to create stakeholder" });
    }
  });

  // PMP recommendations routes
  app.get("/api/pmp-recommendations", async (req, res) => {
    try {
      const { programId, projectId } = req.query;
      const recommendations = await storage.getPmpRecommendations(
        programId as string, 
        projectId as string
      );
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching PMP recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.patch("/api/pmp-recommendations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const recommendation = await storage.updatePmpRecommendation(id, req.body);
      res.json(recommendation);
    } catch (error) {
      console.error("Error updating PMP recommendation:", error);
      res.status(500).json({ message: "Failed to update recommendation" });
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
