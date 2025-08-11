import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlatformSchema,
  insertProgramSchema,
  insertMilestoneSchema,
  insertMilestoneStepSchema,
  insertJiraBepicSchema,
  insertJiraEpicSchema,
  insertJiraStorySchema,
  insertProgramPhaseSchema,
  insertPhaseStageSchema,
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

  // Platform routes
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  app.get("/api/platforms/:id", async (req, res) => {
    try {
      const platform = await storage.getPlatform(req.params.id);
      if (!platform) {
        return res.status(404).json({ message: "Platform not found" });
      }
      res.json(platform);
    } catch (error) {
      console.error("Error fetching platform:", error);
      res.status(500).json({ message: "Failed to fetch platform" });
    }
  });

  app.post("/api/platforms", async (req, res) => {
    try {
      const validatedData = insertPlatformSchema.parse(req.body);
      const platform = await storage.createPlatform(validatedData);
      res.status(201).json(platform);
    } catch (error) {
      console.error("Error creating platform:", error);
      res.status(400).json({ message: "Failed to create platform" });
    }
  });

  app.patch("/api/platforms/:id", async (req, res) => {
    try {
      const validatedData = insertPlatformSchema.partial().parse(req.body);
      const platform = await storage.updatePlatform(req.params.id, validatedData);
      res.json(platform);
    } catch (error) {
      console.error("Error updating platform:", error);
      res.status(400).json({ message: "Failed to update platform" });
    }
  });

  app.delete("/api/platforms/:id", async (req, res) => {
    try {
      await storage.deletePlatform(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting platform:", error);
      res.status(500).json({ message: "Failed to delete platform" });
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

  // Generate missing component risks for a program
  app.post("/api/programs/:id/generate-missing-risks", async (req, res) => {
    try {
      await (storage as any).generateMissingComponentRisks(req.params.id);
      res.json({ message: "Missing component risks generated successfully" });
    } catch (error) {
      console.error("Error generating missing component risks:", error);
      res.status(500).json({ message: "Failed to generate missing component risks" });
    }
  });

  // Generate missing component risks for ALL programs
  app.post("/api/programs/generate-all-missing-risks", async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      for (const program of programs) {
        await (storage as any).generateMissingComponentRisks(program.id);
      }
      res.json({ 
        message: "Missing component risks generated for all programs",
        programCount: programs.length 
      });
    } catch (error) {
      console.error("Error generating missing component risks for all programs:", error);
      res.status(500).json({ message: "Failed to generate missing component risks for all programs" });
    }
  });

  // Comprehensive gap detection for a program
  app.post("/api/programs/:id/detect-gaps", async (req, res) => {
    try {
      await (storage as any).detectAllProgramGaps(req.params.id);
      res.json({ message: "Comprehensive gap detection completed" });
    } catch (error) {
      console.error("Error detecting gaps:", error);
      res.status(500).json({ message: "Failed to detect gaps" });
    }
  });

  // Import risks from JIRA (Live mode)
  app.post("/api/programs/:id/import-jira-risks", async (req, res) => {
    try {
      const risks = await (storage as any).importJiraRisks(req.params.id);
      res.json({ 
        message: "JIRA risks imported successfully",
        risksImported: risks.length,
        risks 
      });
    } catch (error) {
      console.error("Error importing JIRA risks:", error);
      res.status(500).json({ message: "Failed to import JIRA risks" });
    }
  });

  // Comprehensive gap detection for ALL programs
  app.post("/api/programs/detect-all-gaps", async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      for (const program of programs) {
        await (storage as any).detectAllProgramGaps(program.id);
      }
      res.json({ 
        message: "Comprehensive gap detection completed for all programs",
        programCount: programs.length 
      });
    } catch (error) {
      console.error("Error detecting gaps for all programs:", error);
      res.status(500).json({ message: "Failed to detect gaps for all programs" });
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

  // Milestone Step routes
  app.get("/api/milestone-steps", async (req, res) => {
    try {
      const { milestoneId } = req.query;
      const steps = await storage.getMilestoneSteps(milestoneId as string);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching milestone steps:", error);
      res.status(500).json({ message: "Failed to fetch milestone steps" });
    }
  });

  app.post("/api/milestone-steps", async (req, res) => {
    try {
      const validatedData = insertMilestoneStepSchema.parse(req.body);
      const step = await storage.createMilestoneStep(validatedData);
      res.status(201).json(step);
    } catch (error) {
      console.error("Error creating milestone step:", error);
      res.status(400).json({ message: "Failed to create milestone step" });
    }
  });

  app.patch("/api/milestone-steps/:id", async (req, res) => {
    try {
      const validatedData = insertMilestoneStepSchema.partial().parse(req.body);
      const step = await storage.updateMilestoneStep(req.params.id, validatedData);
      res.json(step);
    } catch (error) {
      console.error("Error updating milestone step:", error);
      res.status(400).json({ message: "Failed to update milestone step" });
    }
  });

  app.delete("/api/milestone-steps/:id", async (req, res) => {
    try {
      await storage.deleteMilestoneStep(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting milestone step:", error);
      res.status(500).json({ message: "Failed to delete milestone step" });
    }
  });

  // JIRA Bepic routes
  app.get("/api/jira-bepics", async (req, res) => {
    try {
      const { stepId } = req.query;
      const bepics = await storage.getJiraBepics(stepId as string);
      res.json(bepics);
    } catch (error) {
      console.error("Error fetching JIRA bepics:", error);
      res.status(500).json({ message: "Failed to fetch JIRA bepics" });
    }
  });

  app.post("/api/jira-bepics", async (req, res) => {
    try {
      const validatedData = insertJiraBepicSchema.parse(req.body);
      const bepic = await storage.createJiraBepic(validatedData);
      res.status(201).json(bepic);
    } catch (error) {
      console.error("Error creating JIRA bepic:", error);
      res.status(400).json({ message: "Failed to create JIRA bepic" });
    }
  });

  app.patch("/api/jira-bepics/:id", async (req, res) => {
    try {
      const validatedData = insertJiraBepicSchema.partial().parse(req.body);
      const bepic = await storage.updateJiraBepic(req.params.id, validatedData);
      res.json(bepic);
    } catch (error) {
      console.error("Error updating JIRA bepic:", error);
      res.status(400).json({ message: "Failed to update JIRA bepic" });
    }
  });

  // JIRA Epic routes
  app.get("/api/jira-epics", async (req, res) => {
    try {
      const { bepicId } = req.query;
      const epics = await storage.getJiraEpics(bepicId as string);
      res.json(epics);
    } catch (error) {
      console.error("Error fetching JIRA epics:", error);
      res.status(500).json({ message: "Failed to fetch JIRA epics" });
    }
  });

  app.post("/api/jira-epics", async (req, res) => {
    try {
      const validatedData = insertJiraEpicSchema.parse(req.body);
      const epic = await storage.createJiraEpic(validatedData);
      res.status(201).json(epic);
    } catch (error) {
      console.error("Error creating JIRA epic:", error);
      res.status(400).json({ message: "Failed to create JIRA epic" });
    }
  });

  app.patch("/api/jira-epics/:id", async (req, res) => {
    try {
      const validatedData = insertJiraEpicSchema.partial().parse(req.body);
      const epic = await storage.updateJiraEpic(req.params.id, validatedData);
      res.json(epic);
    } catch (error) {
      console.error("Error updating JIRA epic:", error);
      res.status(400).json({ message: "Failed to update JIRA epic" });
    }
  });

  // JIRA Story routes
  app.get("/api/jira-stories", async (req, res) => {
    try {
      const { epicId } = req.query;
      const stories = await storage.getJiraStories(epicId as string);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching JIRA stories:", error);
      res.status(500).json({ message: "Failed to fetch JIRA stories" });
    }
  });

  app.post("/api/jira-stories", async (req, res) => {
    try {
      const validatedData = insertJiraStorySchema.parse(req.body);
      const story = await storage.createJiraStory(validatedData);
      res.status(201).json(story);
    } catch (error) {
      console.error("Error creating JIRA story:", error);
      res.status(400).json({ message: "Failed to create JIRA story" });
    }
  });

  app.patch("/api/jira-stories/:id", async (req, res) => {
    try {
      const validatedData = insertJiraStorySchema.partial().parse(req.body);
      const story = await storage.updateJiraStory(req.params.id, validatedData);
      res.json(story);
    } catch (error) {
      console.error("Error updating JIRA story:", error);
      res.status(400).json({ message: "Failed to update JIRA story" });
    }
  });

  // Program Phase routes
  app.get("/api/program-phases", async (req, res) => {
    try {
      const { programId, projectId } = req.query;
      const phases = await storage.getProgramPhases(programId as string, projectId as string);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching program phases:", error);
      res.status(500).json({ message: "Failed to fetch program phases" });
    }
  });

  app.post("/api/program-phases", async (req, res) => {
    try {
      const validatedData = insertProgramPhaseSchema.parse(req.body);
      const phase = await storage.createProgramPhase(validatedData);
      res.status(201).json(phase);
    } catch (error) {
      console.error("Error creating program phase:", error);
      res.status(400).json({ message: "Failed to create program phase" });
    }
  });

  app.patch("/api/program-phases/:id", async (req, res) => {
    try {
      const validatedData = insertProgramPhaseSchema.partial().parse(req.body);
      const phase = await storage.updateProgramPhase(req.params.id, validatedData);
      res.json(phase);
    } catch (error) {
      console.error("Error updating program phase:", error);
      res.status(400).json({ message: "Failed to update program phase" });
    }
  });

  // Phase Stage routes
  app.get("/api/phase-stages", async (req, res) => {
    try {
      const { programPhaseId } = req.query;
      const stages = await storage.getPhaseStages(programPhaseId as string);
      res.json(stages);
    } catch (error) {
      console.error("Error fetching phase stages:", error);
      res.status(500).json({ message: "Failed to fetch phase stages" });
    }
  });

  app.post("/api/phase-stages", async (req, res) => {
    try {
      const validatedData = insertPhaseStageSchema.parse(req.body);
      const stage = await storage.createPhaseStage(validatedData);
      res.status(201).json(stage);
    } catch (error) {
      console.error("Error creating phase stage:", error);
      res.status(400).json({ message: "Failed to create phase stage" });
    }
  });

  app.patch("/api/phase-stages/:id", async (req, res) => {
    try {
      const validatedData = insertPhaseStageSchema.partial().parse(req.body);
      const stage = await storage.updatePhaseStage(req.params.id, validatedData);
      res.json(stage);
    } catch (error) {
      console.error("Error updating phase stage:", error);
      res.status(400).json({ message: "Failed to update phase stage" });
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

        // Check for missing program details
        if (!program.startDate) {
          missingComponents.push("start_date");
          riskAlerts.push({
            type: "missing_detail",
            severity: "medium",
            title: "Missing Start Date",
            description: `Program "${program.name}" has no start date defined.`,
            recommendation: "Define a clear start date to establish timeline expectations."
          });
        }

        if (!program.endDate) {
          missingComponents.push("end_date");
          riskAlerts.push({
            type: "missing_detail",
            severity: "medium",
            title: "Missing End Date",
            description: `Program "${program.name}" has no end date defined.`,
            recommendation: "Define a target end date to establish completion timeline."
          });
        }

        if (!program.ownerId) {
          missingComponents.push("owner");
          riskAlerts.push({
            type: "missing_detail",
            severity: "high",
            title: "No Owner Assigned",
            description: `Program "${program.name}" has no owner assigned.`,
            recommendation: "Assign a program owner to ensure accountability and decision-making authority."
          });
        }

        if (!program.description || program.description.trim().length < 10) {
          missingComponents.push("description");
          riskAlerts.push({
            type: "missing_detail",
            severity: "low",
            title: "Insufficient Description",
            description: `Program "${program.name}" lacks proper description or clarification.`,
            recommendation: "Add comprehensive program description to clarify objectives and scope."
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

  // AI Assistant endpoint for processing user requests and performing actions
  app.post("/api/ai/process-request", async (req, res) => {
    try {
      const { request, context } = req.body;
      
      if (!request || typeof request !== 'string') {
        return res.status(400).json({ message: "Request text is required" });
      }

      // Parse the user request and determine what action to take
      const requestLower = request.toLowerCase();
      const response = {
        message: "",
        success: false,
        createdItems: [] as any[],
        actions: [] as any[]
      };

      // Handle delete requests first
      if (requestLower.includes('delete') || requestLower.includes('remove')) {
        try {
          if (requestLower.includes('all') && requestLower.includes('program')) {
            // Delete all programs
            const programs = await storage.getPrograms();
            if (programs.length === 0) {
              response.message = "No programs found to delete.";
              response.success = true;
            } else {
              let deletedCount = 0;
              let errors: string[] = [];
              
              for (const program of programs) {
                try {
                  await storage.deleteProgram(program.id);
                  deletedCount++;
                } catch (error) {
                  console.error(`Failed to delete program ${program.id}:`, error);
                  errors.push(`Failed to delete "${program.name}"`);
                }
              }
              
              response.success = deletedCount > 0;
              if (errors.length > 0) {
                response.message = `Deleted ${deletedCount} program(s). ${errors.length} programs could not be deleted due to database constraints. ${errors.join(', ')}.`;
              } else {
                response.message = `Successfully deleted ${deletedCount} program(s). All programs have been removed from the system.`;
              }
              response.actions = [{
                type: 'navigate',
                target: '/dashboard'
              }];
            }
          } else if (requestLower.includes('program')) {
            // Delete specific program (for now, delete the first one as an example)
            const programs = await storage.getPrograms();
            if (programs.length === 0) {
              response.message = "No programs found to delete.";
              response.success = true;
            } else {
              const programToDelete = programs[0];
              await storage.deleteProgram(programToDelete.id);
              
              response.success = true;
              response.message = `Successfully deleted program "${programToDelete.name}".`;
              response.actions = [{
                type: 'navigate',
                target: '/dashboard'
              }];
            }
          } else if (requestLower.includes('risk')) {
            // Delete risks
            const risks = await storage.getRisks();
            if (risks.length === 0) {
              response.message = "No risks found to delete.";
              response.success = true;
            } else {
              await storage.deleteRisk(risks[0].id);
              response.success = true;
              response.message = `Successfully deleted risk "${risks[0].title}".`;
            }
          } else {
            response.message = "Please specify what you'd like to delete (e.g., 'delete all programs', 'delete a program', 'delete a risk').";
            response.success = false;
          }
        } catch (error) {
          response.message = `Failed to delete: ${error}`;
          response.success = false;
        }
      }

      // Handle update requests
      else if (requestLower.includes('update') || requestLower.includes('change') || requestLower.includes('modify')) {
        try {
          if (requestLower.includes('program') && requestLower.includes('status')) {
            const programs = await storage.getPrograms();
            if (programs.length === 0) {
              response.message = "No programs found to update.";
              response.success = true;
            } else {
              const targetProgram = programs[0];
              const newStatus = requestLower.includes('active') ? 'active' :
                               requestLower.includes('completed') ? 'completed' :
                               requestLower.includes('on_hold') ? 'on_hold' : 'planning';
              
              await storage.updateProgram(targetProgram.id, { status: newStatus });
              
              response.success = true;
              response.message = `Successfully updated program "${targetProgram.name}" status to ${newStatus}.`;
              response.actions = [{
                type: 'navigate',
                target: `/programs/${targetProgram.id}`
              }];
            }
          } else {
            response.message = "I can help update program status. Try: 'update program status to active' or 'change program status to completed'.";
            response.success = true;
          }
        } catch (error) {
          response.message = `Failed to update: ${error}`;
          response.success = false;
        }
      }

      // Handle program creation requests
      else if (requestLower.includes('create') && (requestLower.includes('program') || requestLower.includes('project'))) {
        try {
          // Extract program name from request - prioritize quoted names
          let programName = null;
          
          // First check for quoted names (highest priority)
          const quotedMatch = request.match(/"([^"]+)"/);
          if (quotedMatch) {
            programName = quotedMatch[1];
          } else {
            // Then check for single quoted names
            const singleQuotedMatch = request.match(/'([^']+)'/);
            if (singleQuotedMatch) {
              programName = singleQuotedMatch[1];
            } else {
              // Then check for named/called patterns without quotes
              const namedMatch = request.match(/(?:called|named)\s+([^"'\s].+?)(?:\s*$)/i);
              if (namedMatch) {
                programName = namedMatch[1];
              } else {
                // Generate a name based on context
                const programCount = context?.programCount || 0;
                programName = `AI Created Program ${programCount + 1}`;
              }
            }
          }

          // Clean up the name
          programName = programName.trim();

          const programData = {
            name: programName,
            description: `Program created by AI Assistant based on user request: "${request}"`,
            status: 'planning' as const
          };

          const validatedData = insertProgramSchema.parse(programData);
          const newProgram = await storage.createProgram(validatedData);
          
          response.success = true;
          response.message = `Successfully created program "${newProgram.name}"! The program is now in planning status and will automatically generate missing component risks.`;
          response.createdItems = [{
            type: 'program',
            id: newProgram.id,
            name: newProgram.name
          }];
          response.actions = [{
            type: 'navigate',
            target: `/programs/${newProgram.id}`
          }];

        } catch (error) {
          response.message = `Failed to create program: ${error}`;
          response.success = false;
        }
      }
      
      // Handle risk creation requests
      else if (requestLower.includes('create') && requestLower.includes('risk')) {
        try {
          const programs = await storage.getPrograms();
          if (programs.length === 0) {
            response.message = "No programs found. Create a program first, then I can add risks to it.";
            response.success = false;
          } else {
            // Use first program if not specified
            const targetProgram = programs[0];
            
            const riskData = {
              title: `AI Generated Risk`,
              description: `Risk created by AI Assistant based on user request: "${request}"`,
              severity: 'medium' as const,
              impact: 3,
              probability: 3,
              status: 'open' as const,
              category: 'operational' as const,
              programId: targetProgram.id
            };

            const validatedData = insertRiskSchema.parse(riskData);
            const newRisk = await storage.createRisk(validatedData);
            
            response.success = true;
            response.message = `Successfully created risk "${newRisk.title}" for program "${targetProgram.name}"!`;
            response.createdItems = [{
              type: 'risk',
              id: newRisk.id,
              name: newRisk.title
            }];
            response.actions = [{
              type: 'navigate',
              target: `/risk-management?riskId=${newRisk.id}`
            }];
          }
        } catch (error) {
          response.message = `Failed to create risk: ${error}`;
          response.success = false;
        }
      }
      
      // Handle milestone creation requests
      else if (requestLower.includes('create') && requestLower.includes('milestone')) {
        try {
          const programs = await storage.getPrograms();
          if (programs.length === 0) {
            response.message = "No programs found. Create a program first, then I can add milestones to it.";
            response.success = false;
          } else {
            const targetProgram = programs[0];
            
            const milestoneData = {
              title: `AI Generated Milestone`,
              description: `Milestone created by AI Assistant based on user request: "${request}"`,
              status: 'not_started' as const,
              programId: targetProgram.id,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            };

            const validatedData = insertMilestoneSchema.parse(milestoneData);
            const newMilestone = await storage.createMilestone(validatedData);
            
            response.success = true;
            response.message = `Successfully created milestone "${newMilestone.title}" for program "${targetProgram.name}"!`;
            response.createdItems = [{
              type: 'milestone',
              id: newMilestone.id,
              name: newMilestone.title
            }];
            response.actions = [{
              type: 'navigate',
              target: `/programs/${targetProgram.id}`
            }];
          }
        } catch (error) {
          response.message = `Failed to create milestone: ${error}`;
          response.success = false;
        }
      }
      
      // Handle data analysis requests
      else if (requestLower.includes('analyze') || requestLower.includes('report') || requestLower.includes('summary')) {
        const programs = await storage.getPrograms();
        const risks = await storage.getRisks();
        const milestones = await storage.getMilestones();
        
        response.success = true;
        response.message = `Analysis Summary:
        
📊 Current Status:
• ${programs.length} total programs
• ${risks.length} total risks across all programs  
• ${milestones.length} total milestones
• ${risks.filter(r => r.severity === 'critical' || r.severity === 'high').length} high/critical risks need attention

🎯 Program Health:
${programs.map(p => {
  const programRisks = risks.filter(r => r.programId === p.id);
  const programMilestones = milestones.filter(m => m.programId === p.id);
  return `• ${p.name}: ${programRisks.length} risks, ${programMilestones.length} milestones`;
}).join('\n') || '• No programs to analyze'}

💡 Recommendations:
• Focus on resolving high/critical risks first
• Ensure all programs have proper ownership and timelines
• Track milestone progress regularly`;

        response.actions = [{
          type: 'navigate',
          target: '/dashboard'
        }];
      }


      // Handle navigation requests
      else if (requestLower.includes('show') || requestLower.includes('go to') || requestLower.includes('navigate')) {
        let targetPath = '/dashboard';
        
        if (requestLower.includes('risk')) {
          targetPath = '/risk-management';
        } else if (requestLower.includes('program')) {
          targetPath = '/programs';
        } else if (requestLower.includes('dashboard')) {
          targetPath = '/dashboard';
        }
        
        response.success = true;
        response.message = `Taking you to ${targetPath.replace('/', '').replace('-', ' ')}...`;
        response.actions = [{
          type: 'navigate',
          target: targetPath
        }];
      }
      
      // Default response for unrecognized requests
      else {
        response.message = `I understand you want to "${request}". Here's what I can help you with:

🏗️ **Create Items:**
• "Create a new program called [name]"
• "Add a risk to the program"  
• "Create a milestone for the project"

🗑️ **Delete Items:**
• "Delete all programs"
• "Remove a program"
• "Delete a risk"

✏️ **Update Items:**
• "Update program status to active"
• "Change program status to completed"
• "Modify program status to on hold"

📊 **Analysis & Reports:**
• "Analyze current program status"
• "Show me a summary report"
• "What's the current health status?"

🧭 **Navigation:**
• "Go to the dashboard"
• "Show me the risk management page"
• "Navigate to programs"

Try being more specific about what you'd like me to do!`;
        response.success = true;
      }

      res.json(response);
    } catch (error) {
      console.error("Error processing AI request:", error);
      res.status(500).json({ 
        message: "Failed to process your request. Please try again.",
        success: false,
        createdItems: [],
        actions: []
      });
    }
  });

  // Enhanced contextual routes for all components
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
          dependencyCount: programDependencies.length,
          adopterCount: programAdopters.length,
          milestoneCount: programMilestones.length - 1,
          projectCount: programProjects.length,
          healthScore: Math.round(((programRisks.filter(r => r.status === 'resolved').length / Math.max(programRisks.length, 1)) * 100))
        }
      });
    } catch (error) {
      console.error("Error fetching milestone context:", error);
      res.status(500).json({ message: "Failed to fetch milestone context" });
    }
  });

  app.get("/api/risks/:id/context", async (req, res) => {
    try {
      const risk = await storage.getRisk(req.params.id);
      if (!risk) {
        return res.status(404).json({ message: "Risk not found" });
      }

      const program = risk.programId ? await storage.getProgram(risk.programId) : null;
      const programRisks = program ? await storage.getRisks(program.id) : [];
      const programMilestones = program ? await storage.getMilestones(program.id) : [];
      const programDependencies = program ? await storage.getDependencies(program.id) : [];
      const programAdopters = program ? await storage.getAdopters(program.id) : [];
      const programProjects = program ? await storage.getProjects(program.id) : [];

      res.json({
        risk,
        program,
        relatedComponents: {
          risks: programRisks.filter(r => r.id !== risk.id),
          milestones: programMilestones,
          dependencies: programDependencies,
          adopters: programAdopters,
          projects: programProjects
        },
        analytics: {
          riskCount: programRisks.length - 1,
          milestoneCount: programMilestones.length,
          dependencyCount: programDependencies.length,
          adopterCount: programAdopters.length,
          projectCount: programProjects.length,
          riskScore: (risk.impact || 3) * (risk.probability || 3),
          programHealthScore: Math.round(((programRisks.filter(r => r.status === 'resolved').length / Math.max(programRisks.length, 1)) * 100))
        }
      });
    } catch (error) {
      console.error("Error fetching risk context:", error);
      res.status(500).json({ message: "Failed to fetch risk context" });
    }
  });

  app.get("/api/dependencies/:id/context", async (req, res) => {
    try {
      const dependency = await storage.getDependency(req.params.id);
      if (!dependency) {
        return res.status(404).json({ message: "Dependency not found" });
      }

      const program = dependency.programId ? await storage.getProgram(dependency.programId) : null;
      const programDependencies = program ? await storage.getDependencies(program.id) : [];
      const programMilestones = program ? await storage.getMilestones(program.id) : [];
      const programRisks = program ? await storage.getRisks(program.id) : [];
      const programAdopters = program ? await storage.getAdopters(program.id) : [];
      const programProjects = program ? await storage.getProjects(program.id) : [];

      res.json({
        dependency,
        program,
        relatedComponents: {
          dependencies: programDependencies.filter(d => d.id !== dependency.id),
          milestones: programMilestones,
          risks: programRisks,
          adopters: programAdopters,
          projects: programProjects
        },
        analytics: {
          dependencyCount: programDependencies.length - 1,
          milestoneCount: programMilestones.length,
          riskCount: programRisks.length,
          adopterCount: programAdopters.length,
          projectCount: programProjects.length,
          blockedCount: programDependencies.filter(d => d.status === 'blocked').length,
          programHealthScore: Math.round(((programDependencies.filter(d => d.status === 'completed').length / Math.max(programDependencies.length, 1)) * 100))
        }
      });
    } catch (error) {
      console.error("Error fetching dependency context:", error);
      res.status(500).json({ message: "Failed to fetch dependency context" });
    }
  });

  app.get("/api/adopters/:id/context", async (req, res) => {
    try {
      const adopter = await storage.getAdopter(req.params.id);
      if (!adopter) {
        return res.status(404).json({ message: "Adopter not found" });
      }

      const program = adopter.programId ? await storage.getProgram(adopter.programId) : null;
      const programAdopters = program ? await storage.getAdopters(program.id) : [];
      const programMilestones = program ? await storage.getMilestones(program.id) : [];
      const programRisks = program ? await storage.getRisks(program.id) : [];
      const programDependencies = program ? await storage.getDependencies(program.id) : [];
      const programProjects = program ? await storage.getProjects(program.id) : [];

      res.json({
        adopter,
        program,
        relatedComponents: {
          adopters: programAdopters.filter(a => a.id !== adopter.id),
          milestones: programMilestones,
          risks: programRisks,
          dependencies: programDependencies,
          projects: programProjects
        },
        analytics: {
          adopterCount: programAdopters.length - 1,
          milestoneCount: programMilestones.length,
          riskCount: programRisks.length,
          dependencyCount: programDependencies.length,
          projectCount: programProjects.length,
          readyCount: programAdopters.filter(a => (a.readinessScore ?? 0) >= 75).length,
          programHealthScore: Math.round((programAdopters.reduce((sum, a) => sum + (a.readinessScore ?? 50), 0) / Math.max(programAdopters.length, 1)))
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
