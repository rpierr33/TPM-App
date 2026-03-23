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
  insertInitiativeSchema,
  insertProjectSchema,
  insertTodoSchema,
  insertDecisionSchema,
  type Program,
  type Project
} from "../shared/schema";
import { aiService } from "./services/ai";
import { integrationService } from "./services/integrations";
import { PMPService } from "./services/pmp";
import { jiraService } from "./services/jira";

const pmpService = new PMPService();
import { WebSocketServer, WebSocket } from "ws";

// Helper: get Jira project key for a program (returns null if not linked)
async function getJiraKeyForProgram(programId: string): Promise<string | null> {
  if (!jiraService.isConfigured()) return null;
  const program = await storage.getProgram(programId);
  return (program as any)?.jiraProjectKey || null;
}

// Helper: push a milestone to Jira (create or update)
async function pushMilestoneToJira(milestone: any, programId: string) {
  const jiraKey = await getJiraKeyForProgram(programId);
  if (!jiraKey) return;
  try {
    if (milestone.jiraEpicKey) {
      // Update existing Jira issue
      await jiraService.updateIssue(milestone.jiraEpicKey, { summary: milestone.title });
      // Sync status via transitions
      await syncStatusToJira(milestone.jiraEpicKey, milestone.status);
    } else {
      // Create new Jira issue
      const jiraIssue = await jiraService.createIssue(jiraKey, milestone.title, milestone.description || "");
      await storage.updateMilestone(milestone.id, { jiraEpicKey: jiraIssue.key } as any);
    }
  } catch (err: any) { console.error("Jira milestone push failed:", err?.message); }
}

// Helper: push a risk to Jira
async function pushRiskToJira(risk: any, programId: string) {
  const jiraKey = await getJiraKeyForProgram(programId);
  if (!jiraKey) return;
  try {
    if (risk.jiraIssueKey) {
      await jiraService.updateIssue(risk.jiraIssueKey, {
        summary: `[Risk] ${risk.title}`,
        labels: ["risk", risk.severity || "medium"],
      });
    } else {
      const desc = `Severity: ${risk.severity || 'unknown'}\n${risk.description || ''}\nMitigation: ${risk.mitigationPlan || 'N/A'}`;
      const jiraIssue = await jiraService.createIssueWithLabels(jiraKey, `[Risk] ${risk.title}`, desc, ["risk", risk.severity || "medium"]);
      await storage.updateRisk(risk.id, { jiraIssueKey: jiraIssue.key } as any);
    }
  } catch (err: any) { console.error("Jira risk push failed:", err?.message); }
}

// Helper: push a decision to Jira
async function pushDecisionToJira(decision: any, programId: string) {
  const jiraKey = await getJiraKeyForProgram(programId);
  if (!jiraKey) return;
  try {
    if (decision.jiraIssueKey) {
      await jiraService.updateIssue(decision.jiraIssueKey, {
        summary: `[Decision] ${decision.title}`,
        labels: ["decision", decision.status || "proposed"],
      });
    } else {
      const desc = `Status: ${decision.status}\nRationale: ${decision.rationale || 'N/A'}\nImpact: ${decision.impact || 'N/A'}`;
      const jiraIssue = await jiraService.createIssueWithLabels(jiraKey, `[Decision] ${decision.title}`, desc, ["decision"]);
      await storage.updateDecision(decision.id, { jiraIssueKey: jiraIssue.key } as any);
    }
  } catch (err: any) { console.error("Jira decision push failed:", err?.message); }
}

// Helper: push a todo as a comment on the program's Jira project
async function pushTodoToJira(todo: any, programId: string) {
  const jiraKey = await getJiraKeyForProgram(programId);
  if (!jiraKey) return;
  try {
    // Find any Jira issue in this project to attach the comment to
    // Use the first milestone's Jira key, or search for the project's root issue
    const milestones = await storage.getMilestones(programId);
    const linkedMilestone = milestones.find((m: any) => m.jiraEpicKey);
    if (linkedMilestone?.jiraEpicKey) {
      const statusEmoji = todo.status === 'completed' ? '✅' : todo.status === 'in_progress' ? '🔄' : '📋';
      const comment = `${statusEmoji} Todo [${todo.status}]: ${todo.title}${todo.description ? '\n' + todo.description : ''}${todo.priority ? ' (Priority: ' + todo.priority + ')' : ''}`;
      await jiraService.addComment(linkedMilestone.jiraEpicKey, comment);
    }
  } catch (err: any) { console.error("Jira todo push failed:", err?.message); }
}

// Helper: sync TPM status to Jira via transitions
async function syncStatusToJira(jiraIssueKey: string, tpmStatus: string) {
  try {
    const transitions = await jiraService.getTransitions(jiraIssueKey);
    let targetTransition: any = null;
    if (['completed', 'resolved', 'closed'].includes(tpmStatus)) {
      targetTransition = transitions.find((t: any) => ['done', 'closed', 'resolved'].includes(t.name.toLowerCase()));
    } else if (['in_progress', 'active'].includes(tpmStatus)) {
      targetTransition = transitions.find((t: any) => ['in progress', 'in review', 'start progress'].includes(t.name.toLowerCase()));
    }
    if (targetTransition) {
      await jiraService.updateIssueStatus(jiraIssueKey, targetTransition.id);
    }
  } catch { /* transition not available — skip */ }
}

// Helper: check if storage has updateDecision with jiraIssueKey support
// (uses the existing storage.updateDecision which accepts Partial)

// Register only API routes on the Express app (no HTTP server or WebSocket)
export function registerApiRoutes(app: Express): void {
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

  // Dashboard priorities
  app.get("/api/dashboard/priorities", async (req, res) => {
    try {
      const priorities = await storage.getDashboardPriorities();
      res.json(priorities);
    } catch (error) {
      console.error("Error fetching dashboard priorities:", error);
      res.status(500).json({ message: "Failed to fetch dashboard priorities" });
    }
  });

  // Dashboard activity feed — recent items from the last 48 hours
  app.get("/api/dashboard/activity", async (req, res) => {
    try {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const [programs, milestones, risks, escalations] = await Promise.all([
        storage.getPrograms(),
        storage.getMilestones(),
        storage.getRisks(),
        storage.getEscalations(),
      ]);

      // Build a program name lookup
      const programMap = new Map<string, string>();
      for (const p of programs) programMap.set(p.id, p.name);

      const items: Array<{ type: string; title: string; programName: string; action: string; timestamp: string }> = [];

      for (const p of programs) {
        const ts = p.updatedAt || p.createdAt;
        if (ts && new Date(ts) >= cutoff) {
          const isNew = p.createdAt && p.updatedAt && new Date(p.createdAt).getTime() === new Date(p.updatedAt).getTime();
          items.push({ type: 'program', title: p.name, programName: '', action: isNew ? 'created' : 'updated', timestamp: String(ts) });
        }
      }
      for (const m of milestones) {
        const ts = m.updatedAt || m.createdAt;
        if (ts && new Date(ts) >= cutoff) {
          items.push({ type: 'milestone', title: m.title, programName: programMap.get(m.programId || '') || '', action: m.status === 'completed' ? 'completed' : 'updated', timestamp: String(ts) });
        }
      }
      for (const r of risks) {
        const ts = r.updatedAt || r.createdAt;
        if (ts && new Date(ts) >= cutoff) {
          items.push({ type: 'risk', title: r.title, programName: programMap.get(r.programId || '') || '', action: r.status === 'resolved' ? 'resolved' : 'updated', timestamp: String(ts) });
        }
      }
      for (const e of escalations) {
        const ts = e.createdAt;
        if (ts && new Date(ts) >= cutoff) {
          items.push({ type: 'escalation', title: e.summary, programName: programMap.get(e.programId || '') || '', action: 'raised', timestamp: String(ts) });
        }
      }

      // Sort newest first, return top 10
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(items.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard activity:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
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
      const scope = req.query.scope as string;
      const userId = req.auth?.userId;
      let programs;
      if (scope === 'mine' && userId) {
        programs = await storage.getProgramsByOwner(userId);
      } else {
        programs = await storage.getPrograms();
      }
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
      const validatedData = insertProgramSchema.parse({
        ...req.body,
        ownerId: req.body.ownerId || req.auth?.userId || null,
      });
      const program = await storage.createProgram(validatedData);

      // Broadcast real-time update
      (app as any).broadcast('data_changed', { type: 'program_created', data: program });

      // Auto-create Jira project for this program
      if (jiraService.isConfigured() && !(program as any).jiraProjectKey) {
        try {
          let baseKey = program.name
            .replace(/[^a-zA-Z\s]/g, '')
            .split(/\s+/)
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .substring(0, 6);
          if (baseKey.length < 2) baseKey = program.name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
          if (baseKey.length < 2) baseKey = 'TPM';

          const existingProjects = await jiraService.getProjects();
          const existingKeys = new Set(existingProjects.map(p => p.key));
          let key = baseKey;
          let suffix = 1;
          while (existingKeys.has(key)) { key = `${baseKey}${suffix}`; suffix++; }

          const jiraProject = await jiraService.createProject(program.name, key);
          await storage.updateProgram(program.id, { jiraProjectKey: jiraProject.key } as any);
          (program as any).jiraProjectKey = jiraProject.key;
        } catch (jiraErr: any) {
          console.error("Failed to create Jira project for new program:", jiraErr?.message);
        }
      }

      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(400).json({ message: "Failed to create program" });
    }
  });

  app.put("/api/programs/:id", async (req, res) => {
    try {
      // Use loose validation — allow partial updates without strict FK checks
      const allowedFields = ['name', 'description', 'status', 'ownerId', 'ownerName', 'platformId', 'startDate', 'endDate', 'objectives', 'kpis', 'disabledComponents', 'dismissedWarnings', 'jiraProjectKey'];
      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in req.body) {
          // Convert date strings to Date objects
          if ((key === 'startDate' || key === 'endDate') && req.body[key]) {
            updateData[key] = new Date(req.body[key]);
          } else {
            updateData[key] = req.body[key];
          }
        }
      }
      const program = await storage.updateProgram(req.params.id, updateData);
      
      // Broadcast real-time update
      (app as any).broadcast('data_changed', { type: 'program_updated', data: program });
      
      res.json(program);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(400).json({ message: "Failed to update program" });
    }
  });

  app.delete("/api/programs/:id", async (req, res) => {
    try {
      await storage.deleteProgram(req.params.id);
      
      // Broadcast real-time update
      (app as any).broadcast('data_changed', { type: 'program_deleted', data: { id: req.params.id } });
      
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
      
      // Broadcast real-time update
      (app as any).broadcast('data_changed', { type: 'milestone_created', data: milestone });

      // Auto-push to Jira if program is linked
      if (milestone.programId) {
        pushMilestoneToJira(milestone, milestone.programId);
      }

      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(400).json({ message: "Failed to create milestone" });
    }
  });

  app.patch("/api/milestones/:id", async (req, res) => {
    try {
      const validatedData = insertMilestoneSchema.partial().parse(req.body);
      const milestone = await storage.updateMilestone(req.params.id, validatedData);
      (app as any).broadcast('data_changed', { type: 'milestone_updated', data: milestone });

      // Auto-push to Jira
      if (milestone.programId) {
        pushMilestoneToJira(milestone, milestone.programId);
      }

      res.json(milestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(400).json({ message: "Failed to update milestone" });
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
      
      // Broadcast real-time update
      (app as any).broadcast('data_changed', { type: 'risk_created', data: risk });

      // Auto-push to Jira
      if (risk.programId) {
        pushRiskToJira(risk, risk.programId);
      }

      res.status(201).json(risk);
    } catch (error) {
      console.error("Error creating risk:", error);
      res.status(400).json({ message: "Failed to create risk" });
    }
  });

  app.patch("/api/risks/:id", async (req, res) => {
    try {
      const validatedData = insertRiskSchema.partial().parse(req.body);
      const risk = await storage.updateRisk(req.params.id, validatedData);

      // Auto-push to Jira
      if (risk.programId) {
        pushRiskToJira(risk, risk.programId);
      }

      res.json(risk);
    } catch (error) {
      console.error("Error updating risk:", error);
      res.status(400).json({ message: "Failed to update risk" });
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

  app.patch("/api/dependencies/:id", async (req, res) => {
    try {
      const validatedData = insertDependencySchema.partial().parse(req.body);
      const dependency = await storage.updateDependency(req.params.id, validatedData);
      res.json(dependency);
    } catch (error) {
      console.error("Error updating dependency:", error);
      res.status(400).json({ message: "Failed to update dependency" });
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

  app.put("/api/adopters/:id", async (req, res) => {
    try {
      const adopter = await storage.updateAdopter(req.params.id, req.body);
      res.json(adopter);
    } catch (error) {
      console.error("Error updating adopter:", error);
      res.status(500).json({ message: "Failed to update adopter" });
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

  app.patch("/api/escalations/:id", async (req, res) => {
    try {
      const validatedData = insertEscalationSchema.partial().parse(req.body);
      const escalation = await storage.updateEscalation(req.params.id, validatedData);
      (app as any).broadcast('data_changed', { type: 'escalation_updated', data: escalation });
      res.json(escalation);
    } catch (error) {
      console.error("Error updating escalation:", error);
      res.status(400).json({ message: "Failed to update escalation" });
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

  // Todo routes
  app.get("/api/todos", async (req, res) => {
    try {
      const { programId } = req.query;
      const todosList = await storage.getTodos(programId as string);
      res.json(todosList);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ message: "Failed to fetch todos" });
    }
  });

  app.post("/api/todos", async (req, res) => {
    try {
      const validatedData = insertTodoSchema.parse(req.body);
      const todo = await storage.createTodo(validatedData);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'todo_created', data: todo });

      // Push todo as Jira comment
      if (todo.programId) {
        pushTodoToJira(todo, todo.programId);
      }

      res.status(201).json(todo);
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(400).json({ message: "Failed to create todo" });
    }
  });

  app.patch("/api/todos/:id", async (req, res) => {
    try {
      const validatedData = insertTodoSchema.partial().parse(req.body);
      const todo = await storage.updateTodo(req.params.id, validatedData);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'todo_updated', data: todo });

      // Push status update as Jira comment
      if (todo.programId) {
        pushTodoToJira(todo, todo.programId);
      }

      res.json(todo);
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(400).json({ message: "Failed to update todo" });
    }
  });

  app.delete("/api/todos/:id", async (req, res) => {
    try {
      await storage.deleteTodo(req.params.id);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'todo_deleted', id: req.params.id });
      res.json({ message: "Todo deleted" });
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ message: "Failed to delete todo" });
    }
  });

  // Generate todos from PMP recommendations for a program
  app.post("/api/todos/generate/:programId", async (req, res) => {
    try {
      const { programId } = req.params;
      const program = await storage.getProgram(programId);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }

      const [programMilestones, programRisks, programDependencies, programAdopters, existingTodos] = await Promise.all([
        storage.getMilestones(programId),
        storage.getRisks(programId),
        storage.getDependencies(programId),
        storage.getAdopters(programId),
        storage.getTodos(programId),
      ]);

      // Existing PMP todo titles for dedup
      const existingPmpTitles = new Set(
        existingTodos
          .filter(t => t.source === 'pmp_recommendation')
          .map(t => t.title.toLowerCase())
      );

      const todosToCreate: Array<{ title: string; description: string; priority: number }> = [];

      // Check for missing components and generate todos
      if (!program.description || (program.description && program.description.length < 50)) {
        todosToCreate.push({ title: 'Develop Program Charter', description: 'Write comprehensive program charter with clear scope, objectives, and success criteria', priority: 3 });
      }
      if (!program.ownerId) {
        todosToCreate.push({ title: 'Assign Program Manager', description: 'Designate clear ownership and accountability through program leadership', priority: 4 });
      }
      if (!program.startDate) {
        todosToCreate.push({ title: 'Define Start Date', description: 'Establish clear timeline boundaries for program initiation', priority: 2 });
      }
      if (!program.endDate) {
        todosToCreate.push({ title: 'Establish End Date', description: 'Set time-bound objectives for successful program closure', priority: 2 });
      }
      if (programMilestones.length === 0) {
        todosToCreate.push({ title: 'Create Work Breakdown Structure', description: 'Define milestones and decompose work into trackable deliverables', priority: 5 });
      }
      if (programRisks.length === 0) {
        todosToCreate.push({ title: 'Conduct Risk Assessment', description: 'Identify and assess risks with mitigation strategies', priority: 4 });
      }
      if (programDependencies.length === 0) {
        todosToCreate.push({ title: 'Map Dependencies', description: 'Identify cross-program and external dependencies for critical path management', priority: 3 });
      }
      if (programAdopters.length === 0) {
        todosToCreate.push({ title: 'Identify Stakeholders & Adopters', description: 'Map stakeholder influence and plan engagement strategy', priority: 3 });
      }
      if (!program.objectives || (Array.isArray(program.objectives) && program.objectives.length === 0)) {
        todosToCreate.push({ title: 'Define SMART Objectives', description: 'Set specific, measurable, achievable, relevant, time-bound objectives', priority: 3 });
      }
      if (!program.kpis || (Array.isArray(program.kpis) && program.kpis.length === 0)) {
        todosToCreate.push({ title: 'Establish KPIs', description: 'Define measurable success criteria and performance indicators', priority: 2 });
      }

      // Critical risks need response plans
      const criticalRisks = programRisks.filter(r => r.severity === 'critical' || r.severity === 'high');
      if (criticalRisks.length > 0) {
        todosToCreate.push({ title: 'Implement Risk Response Plans', description: `${criticalRisks.length} critical/high risks need immediate response strategies`, priority: 5 });
      }

      // Blocked dependencies
      const blockedDeps = programDependencies.filter(d => d.status === 'blocked');
      if (blockedDeps.length > 0) {
        todosToCreate.push({ title: 'Resolve Blocked Dependencies', description: `${blockedDeps.length} dependencies are currently blocked and need escalation`, priority: 5 });
      }

      // Filter out duplicates
      const newTodos = todosToCreate.filter(t => !existingPmpTitles.has(t.title.toLowerCase()));

      // Create the todos
      const created = [];
      for (const todo of newTodos) {
        const result = await storage.createTodo({
          title: todo.title,
          description: todo.description,
          programId,
          source: 'pmp_recommendation',
          priority: todo.priority,
          status: 'not_started',
        });
        created.push(result);
      }

      res.json({ generated: created.length, todos: created });
    } catch (error) {
      console.error("Error generating todos:", error);
      res.status(500).json({ message: "Failed to generate todos" });
    }
  });

  // Decision routes
  app.get("/api/decisions", async (req, res) => {
    try {
      const { programId } = req.query;
      const decisionsList = await storage.getDecisions(programId as string);
      res.json(decisionsList);
    } catch (error) {
      console.error("Error fetching decisions:", error);
      res.status(500).json({ message: "Failed to fetch decisions" });
    }
  });

  app.post("/api/decisions", async (req, res) => {
    try {
      const validatedData = insertDecisionSchema.parse(req.body);
      const decision = await storage.createDecision(validatedData);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'decision_created', data: decision });

      // Auto-push to Jira
      if (decision.programId) {
        pushDecisionToJira(decision, decision.programId);
      }

      res.status(201).json(decision);
    } catch (error) {
      console.error("Error creating decision:", error);
      res.status(400).json({ message: "Failed to create decision" });
    }
  });

  app.patch("/api/decisions/:id", async (req, res) => {
    try {
      const validatedData = insertDecisionSchema.partial().parse(req.body);
      const decision = await storage.updateDecision(req.params.id, validatedData);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'decision_updated', data: decision });

      // Auto-push to Jira
      if (decision.programId) {
        pushDecisionToJira(decision, decision.programId);
      }

      res.json(decision);
    } catch (error) {
      console.error("Error updating decision:", error);
      res.status(400).json({ message: "Failed to update decision" });
    }
  });

  app.delete("/api/decisions/:id", async (req, res) => {
    try {
      await storage.deleteDecision(req.params.id);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'decision_deleted', id: req.params.id });
      res.json({ message: "Decision deleted" });
    } catch (error) {
      console.error("Error deleting decision:", error);
      res.status(500).json({ message: "Failed to delete decision" });
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

  // AI Insights endpoint
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const programId = req.query.programId as string;
      if (!programId) {
        return res.status(400).json({ message: "programId query parameter is required" });
      }
      const insights = await aiService.generateInsights(programId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // AI Analyze endpoint (scenario analysis)
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { programId } = req.body;
      const analysis = await aiService.analyzeProgram(programId || undefined);
      res.json(analysis);
    } catch (error) {
      console.error("Error running AI analysis:", error);
      res.status(500).json({ message: "Failed to run analysis" });
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

  // AI Assistant endpoint - Claude-powered intent parsing + execution + gap analysis
  app.post("/api/ai/process-request", async (req, res) => {
    try {
      const { request, context } = req.body;

      if (!request || typeof request !== 'string') {
        return res.status(400).json({ message: "Request text is required" });
      }

      // Fetch live platform data for context
      const [programs, risks, milestones, dependencies, adopters] = await Promise.all([
        storage.getPrograms(),
        storage.getRisks(),
        storage.getMilestones(),
        storage.getDependencies(),
        storage.getAdopters()
      ]);

      // Fetch Jira data if configured
      let jiraData: any = { connected: false };
      try {
        const jiraStatus = await jiraService.testConnection();
        if (jiraStatus) {
          const jiraProjects = await jiraService.getProjects();
          const allIssues: any[] = [];
          for (const proj of jiraProjects.slice(0, 5)) { // limit to 5 projects
            const issues = await jiraService.getIssues(proj.key);
            allIssues.push(...issues.slice(0, 30).map((i: any) => ({
              key: i.key,
              summary: i.fields?.summary,
              status: i.fields?.status?.name,
              assignee: i.fields?.assignee?.displayName || 'Unassigned',
              priority: i.fields?.priority?.name,
              type: i.fields?.issuetype?.name,
              dueDate: i.fields?.duedate,
              project: proj.key
            })));
          }
          jiraData = {
            connected: true,
            projects: jiraProjects.map((p: any) => ({ key: p.key, name: p.name })),
            issues: allIssues
          };
        }
      } catch (jiraErr: any) {
        console.error("Jira context fetch failed:", jiraErr?.message);
      }

      // Sort programs by createdAt so oldest/newest references work correctly
      const programsSorted = [...programs].sort((a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );

      const liveData = {
        programs: programsSorted.map((p, i) => ({ id: p.id, name: p.name, status: p.status, age_rank: i + 1 })),
        risks: risks.map(r => ({ id: r.id, title: r.title, severity: r.severity, programId: r.programId })),
        milestones: milestones.map(m => ({ id: m.id, title: m.title, status: m.status, programId: m.programId })),
        dependencies: dependencies.map(d => ({ id: d.id, title: d.title, status: d.status })),
        adopters: adopters.map(a => ({ id: a.id, teamName: a.teamName, status: a.status })),
        jira: jiraData
      };

      // Carry recent chat history for context (from request body if provided)
      const recentHistory: string = context?.recentHistory || '';

      // Step 1: Use Claude to parse intent and extract structured commands
      const intentPrompt = `You are a TPM platform AI that can execute real actions. Parse the user's request and return a JSON object.

Current platform state (programs sorted oldest→newest, age_rank 1 = oldest):
${JSON.stringify(liveData, null, 2)}

${recentHistory ? `Recent conversation context:\n${recentHistory}\n` : ''}
User request: "${request}"

Return ONLY valid JSON in this exact format:
{
  "intent": "create_items" | "query" | "update" | "delete" | "analyze" | "generate_report" | "other",
  "commands": [
    {
      "action": "create_program" | "create_milestone" | "create_risk" | "create_dependency" | "update_program" | "delete_program" | "analyze_program" | "generate_report" | "delete_report",
      "parameters": {
        "name": "...(for delete: match by name from live data)",
        "ids": ["...(for delete: use the actual IDs from live data, e.g. oldest 3 = first 3 by age_rank)"],
        "description": "...",
        "status": "planning",
        "programId": "...(use id from live data if a specific program is mentioned, otherwise omit)",
        "title": "...(for milestones/risks)",
        "severity": "...(low/medium/high/critical)",
        "dueDate": "...(ISO date string if mentioned)",
        "reportType": "...(status | executive | weekly | risk — default: status)",
        "portfolio": "...(ONLY set to true if the user's exact words include 'portfolio', 'all programs', or 'cross-program'. NEVER infer this — if the user just says 'generate status report' without specifying a program, do NOT set portfolio. Omit this field unless explicitly triggered.)"
      }
    }
  ],
  "conversational": false
}

Rules:
- "project" and "program" mean the same thing in this platform
- For DELETE with "oldest N": use programs with lowest age_rank values; return one delete_program command per item with the real ID in "ids"
- For DELETE with "newest N": use programs with highest age_rank values
- For DELETE by name: match name from live data
- For multiple creates, return one command per item
- For "generate report" / "status report" / "weekly report": use action "generate_report". If a specific program is named, include its programId from live data. ONLY set portfolio: true if the user literally says "portfolio", "all programs", or "cross-program". If no program is specified and none of those portfolio keywords are used, do NOT set portfolio — omit it entirely so the system can ask the user to clarify.
- For "delete reports" / "clear reports" / "remove reports": use action "delete_report". If user says "all reports", set parameters.all to true. If user specifies a report name, set parameters.name to match.
- If request is a question, complaint, or conversation (not an action), set intent to "query", commands to [], conversational to true
- If the user refers to something that was just done (e.g. "you deleted the wrong ones"), treat as "query" and explain what the system just did based on recent history`;

      let parsedIntent: any = { intent: "query", commands: [], conversational: true };
      try {
        const intentResponse = await aiService.chatWithAI(intentPrompt, {});
        // Extract JSON from the response
        const jsonMatch = intentResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedIntent = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Intent parsing failed:", e);
      }

      const response = {
        message: "",
        success: false,
        createdItems: [] as any[],
        actions: [] as any[]
      };

      // Step 2: Execute commands
      if (parsedIntent.intent !== "query" && parsedIntent.commands?.length > 0) {
        const created: any[] = [];
        const errors: string[] = [];
        let presetMessage = "";  // used by generate_report to override the default "Done." fallback

        for (const cmd of parsedIntent.commands) {
          try {
            if (cmd.action === "create_program") {
              const newProgram = await storage.createProgram({
                name: cmd.parameters.name,
                description: cmd.parameters.description || `Program created via AI assistant`,
                status: "planning"
              });
              created.push({ type: "program", id: newProgram.id, name: newProgram.name, data: newProgram });
              (app as any).broadcast("data_changed", { type: "program_created", data: newProgram });

            } else if (cmd.action === "create_milestone") {
              const programId = cmd.parameters.programId || programs[0]?.id || null;
              const newMilestone = await storage.createMilestone({
                title: cmd.parameters.title || cmd.parameters.name,
                description: cmd.parameters.description || null,
                programId,
                status: "not_started",
                ownerId: null,
                dueDate: cmd.parameters.dueDate ? new Date(cmd.parameters.dueDate) : undefined,
                completedDate: undefined,
                jiraEpicKey: null
              });
              created.push({ type: "milestone", id: newMilestone.id, name: newMilestone.title, data: newMilestone });

            } else if (cmd.action === "create_risk") {
              const programId = cmd.parameters.programId || programs[0]?.id || null;
              const newRisk = await storage.createRisk({
                title: cmd.parameters.title || cmd.parameters.name,
                description: cmd.parameters.description || null,
                programId,
                severity: cmd.parameters.severity || "medium",
                probability: 3,
                impact: 3,
                status: "identified",
                ownerId: null,
                mitigationPlan: null,
                jiraIssueKey: null
              });
              created.push({ type: "risk", id: newRisk.id, name: newRisk.title, data: newRisk });

            } else if (cmd.action === "delete_program") {
              // Support ids array (preferred) or name match fallback
              const idsToDelete: string[] = cmd.parameters.ids?.length
                ? cmd.parameters.ids
                : programs
                    .filter(p => p.name.toLowerCase().includes((cmd.parameters.name || "").toLowerCase()))
                    .map(p => p.id);

              for (const pid of idsToDelete) {
                const target = programs.find(p => p.id === pid);
                if (target) {
                  await storage.deleteProgram(target.id);
                  (app as any).broadcast("data_changed", { type: "program_deleted", data: { id: target.id } });
                  created.push({ type: "deleted_program", name: target.name });
                }
              }

            } else if (cmd.action === "update_program") {
              const target = programs.find(p =>
                p.name.toLowerCase().includes((cmd.parameters.name || "").toLowerCase())
              ) || programs[0];
              if (target) {
                const updated = await storage.updateProgram(target.id, { status: cmd.parameters.status });
                (app as any).broadcast("data_changed", { type: "program_updated", data: updated });
                created.push({ type: "updated_program", name: target.name, status: cmd.parameters.status });
              }

            } else if (cmd.action === "generate_report") {
              const reportType = cmd.parameters.reportType || "status";
              const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
              const specificProgramId = cmd.parameters.programId;
              const broadcastFn = (app as any).broadcast;

              if (programs.length === 0) {
                presetMessage = "No programs exist yet. Create at least one program before generating a report.";
              } else if (cmd.parameters.portfolio || (!specificProgramId && programs.length > 1)) {
                if (!cmd.parameters.portfolio) {
                  // No portfolio flag and multiple programs — ask to clarify
                  const programList = programs.map(p => `- **${p.name}** (${p.status})`).join("\n");
                  presetMessage = `Which program should I generate the **${reportType}** report for?\n\n${programList}\n\nOr say **"generate portfolio status report"** for a cross-program overview.`;
                } else {
                  // Portfolio — single combined report, fire and forget
                  presetMessage = `Generating **Portfolio ${cap(reportType)} Report** covering all ${programs.length} programs in the background. Head to Executive Reports in a moment.`;
                  response.actions = [{ type: "navigate", target: "/executive-reports?tab=reports" }];
                  aiService.generatePortfolioReport(reportType)
                    .then(report => broadcastFn("data_changed", { type: "report_created", data: report }))
                    .catch(e => console.error("Portfolio report failed:", e));
                }
              } else {
                // Single program (named or only one)
                const target = specificProgramId
                  ? programs.find(p => p.id === specificProgramId)
                  : programs[0];
                if (!target) {
                  presetMessage = "Couldn't find that program.";
                } else {
                  presetMessage = `Generating **${cap(reportType)} Report** for "${target.name}" in the background. Head to Executive Reports in a moment.`;
                  response.actions = [{ type: "navigate", target: "/executive-reports?tab=reports" }];
                  aiService.generateReport(target.id, reportType)
                    .then(report => broadcastFn("data_changed", { type: "report_created", data: report }))
                    .catch(e => console.error(`Report failed for ${target.name}:`, e));
                }
              }
            } else if (cmd.action === "delete_report") {
              if (cmd.parameters.all) {
                const count = await storage.deleteAllReports();
                created.push({ type: "deleted_reports", count });
                presetMessage = `Deleted **${count}** report${count !== 1 ? "s" : ""}. The Executive Reports list is now empty.`;
                (app as any).broadcast("data_changed", { type: "reports_deleted", data: {} });
              } else {
                presetMessage = "Please specify which reports to delete, or say **\"delete all reports\"** to clear them all.";
              }
            }
          } catch (err) {
            console.error(`Command failed (${cmd.action}):`, err);
            errors.push(`Failed to ${cmd.action.replace("_", " ")}: ${cmd.parameters.name || ""}`);
          }
        }

        // Step 3: PMI gap analysis for each newly created program
        const createdPrograms = created.filter(c => c.type === "program");
        const gapSummaries: string[] = [];

        if (createdPrograms.length > 0) {
          const gapPrompt = `You are a PMI/PMP expert TPM. These programs were just created and are empty:
${createdPrograms.map(p => `- ${p.name}`).join("\n")}

For EACH program, list missing PMI PMBOK required components. Use this exact format:

**[Program Name]**
- Missing: milestones, risk register, stakeholders, dependencies, adopter plan, OKRs, owner, schedule baseline
- ⚠️ Biggest risk: [one sentence]

Keep it tight — one block per program.`;

          try {
            const gapAnalysis = await aiService.chatWithAI(gapPrompt, {});
            gapSummaries.push(gapAnalysis);
          } catch (e) {
            console.error("Gap analysis failed:", e);
          }
        }

        // Build final message — label correctly by action type
        const newItems = created.filter(c => ["program", "milestone", "risk", "dependency"].includes(c.type));
        const deletedItems = created.filter(c => c.type === "deleted_program");
        const updatedItems = created.filter(c => c.type === "updated_program");
        const reportItems = created.filter(c => c.type === "report");

        let message = presetMessage;  // report handler may have already set a message

        if (!message) {
          if (newItems.length > 0)
            message += `Created: ${newItems.map(c => `"${c.name}"`).join(", ")}.`;
          if (deletedItems.length > 0)
            message += `${message ? " " : ""}Deleted: ${deletedItems.map(c => `"${c.name}"`).join(", ")}.`;
          if (updatedItems.length > 0)
            message += `${message ? " " : ""}Updated: ${updatedItems.map(c => `"${c.name}" → ${c.status}`).join(", ")}.`;
          if (!message) message = "Done.";
        }

        if (errors.length > 0) message += `\n\n**Errors:** ${errors.join("; ")}`;
        if (gapSummaries.length > 0) message += `\n\n${gapSummaries[0]}`;

        response.message = message;
        response.success = created.length > 0 || !!presetMessage;
        response.createdItems = created;

      } else {
        // Conversational / query — pass to chatWithAI with live context
        const aiResponse = await aiService.chatWithAI(request, liveData);
        response.message = aiResponse;
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

  app.put("/api/stakeholders/:id", async (req, res) => {
    try {
      const stakeholder = await storage.updateStakeholder(req.params.id, req.body);
      res.json(stakeholder);
    } catch (error) {
      console.error("Error updating stakeholder:", error);
      res.status(500).json({ message: "Failed to update stakeholder" });
    }
  });

  app.delete("/api/stakeholders/:id", async (req, res) => {
    try {
      await storage.deleteStakeholder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting stakeholder:", error);
      res.status(500).json({ message: "Failed to delete stakeholder" });
    }
  });

  app.get("/api/stakeholders/:id/interactions", async (req, res) => {
    try {
      const interactions = await storage.getStakeholderInteractions(req.params.id);
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });

  app.post("/api/stakeholders/:id/interactions", async (req, res) => {
    try {
      const interaction = await storage.createStakeholderInteraction({
        ...req.body,
        stakeholderId: req.params.id,
      });
      res.json(interaction);
    } catch (error) {
      console.error("Error creating interaction:", error);
      res.status(500).json({ message: "Failed to create interaction" });
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

  app.post("/api/pmp-recommendations/generate", async (req, res) => {
    try {
      const { programId } = req.body;
      const program = programId ? await storage.getProgram(programId) : undefined;
      const recommendations = await pmpService.generateRecommendations({ program });
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating PMP recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.post("/api/pmp-recommendations/:id/drill-deeper", async (req, res) => {
    try {
      const { id } = req.params;
      const recommendations = await storage.getPmpRecommendations();
      const rec = recommendations.find(r => r.id === id);
      if (!rec) return res.status(404).json({ message: "Recommendation not found" });

      const prompt = `You are a PMI-certified PMP expert. A TPM is asking for a deeper explanation of this recommendation:

Recommendation: "${rec.recommendation}"
Phase: ${rec.pmpPhase}
Knowledge Area: ${rec.knowledgeArea}
Reasoning: ${rec.reasoning}

Provide:
1. Why this is critical at this stage (2-3 sentences)
2. Specific action steps (3-5 bullet points)
3. Common pitfalls to avoid (2-3 points)
4. Success metrics to track (2-3 points)

Be concise and actionable. No markdown headers, use plain text with numbered/bulleted structure.`;

      const deeperExplanation = await aiService.chatWithAI(prompt, {});
      res.json({ explanation: deeperExplanation });
    } catch (error) {
      console.error("Error generating deeper explanation:", error);
      res.status(500).json({ message: "Failed to get explanation" });
    }
  });

  app.post("/api/pmp-recommendations/:id/alternatives", async (req, res) => {
    try {
      const { id } = req.params;
      const recommendations = await storage.getPmpRecommendations();
      const rec = recommendations.find(r => r.id === id);
      if (!rec) return res.status(404).json({ message: "Recommendation not found" });

      const prompt = `You are a PMI-certified PMP expert. A TPM wants alternative approaches to this recommendation:

Recommendation: "${rec.recommendation}"
Phase: ${rec.pmpPhase}
Knowledge Area: ${rec.knowledgeArea}

Provide 3 alternative approaches, each with:
- Approach name (1 line)
- What it involves (2 sentences)
- When to use it (1 sentence)
- Trade-offs (1 sentence)

Format: numbered list 1-3. Be practical and specific.`;

      const alternatives = await aiService.chatWithAI(prompt, {});
      res.json({ alternatives });
    } catch (error) {
      console.error("Error generating alternatives:", error);
      res.status(500).json({ message: "Failed to get alternatives" });
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

  app.delete("/api/reports/:id", async (req, res) => {
    try {
      await storage.deleteReport(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  app.delete("/api/reports", async (req, res) => {
    try {
      const count = await storage.deleteAllReports();
      res.json({ message: `Deleted ${count} reports` });
    } catch (error) {
      console.error("Error deleting all reports:", error);
      res.status(500).json({ message: "Failed to delete reports" });
    }
  });

  // PDF download for reports
  app.get("/api/reports/:id/pdf", async (req, res) => {
    try {
      const reports = await storage.getReports();
      const report = reports.find((r: any) => r.id === req.params.id);
      if (!report) return res.status(404).json({ message: "Report not found" });

      const c = report.content as any;
      const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const ragColor = c?.ragStatus === "Green" ? "#16a34a" : c?.ragStatus === "Amber" ? "#ca8a04" : "#dc2626";

      let sections = "";

      if (c?.executiveSummary) {
        sections += `<h2>Executive Summary</h2><p>${esc(c.executiveSummary)}</p>`;
      }
      if (c?.ragStatus) {
        sections += `<h2>RAG Status</h2><p><span style="background:${ragColor};color:white;padding:2px 12px;border-radius:4px;font-weight:bold">${esc(c.ragStatus)}</span></p>`;
      }
      if (c?.keyMetrics) {
        const m = c.keyMetrics;
        sections += `<h2>Key Metrics</h2><table><tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Risks</td><td>${m.totalRisks}</td></tr>
          <tr><td>Critical/High Risks</td><td>${m.criticalRisks}</td></tr>
          ${m.totalPrograms ? `<tr><td>Programs</td><td>${m.totalPrograms}</td></tr>` : ""}
          <tr><td>Milestones</td><td>${m.completedMilestones}/${m.totalMilestones} (${m.milestoneCompletion}%)</td></tr>
          <tr><td>Adopter Readiness</td><td>${m.adopterReadiness}% (${m.adopterCount} teams)</td></tr>
        </table>`;
      }
      if (c?.programBreakdowns?.length) {
        sections += `<h2>Program Breakdown</h2><table><tr><th>Program</th><th>Status</th><th>RAG</th><th>Risks (Critical)</th><th>Milestones</th></tr>`;
        c.programBreakdowns.forEach((pb: any) => {
          const pbColor = pb.rag === "Green" ? "#16a34a" : pb.rag === "Amber" ? "#ca8a04" : "#dc2626";
          sections += `<tr><td>${esc(pb.name)}</td><td>${esc(pb.status)}</td><td><span style="color:${pbColor};font-weight:bold">${esc(pb.rag)}</span></td><td>${pb.risks?.total || 0} (${pb.risks?.criticalHigh || 0})</td><td>${pb.milestones?.completed || 0}/${pb.milestones?.total || 0}</td></tr>`;
        });
        sections += "</table>";
      }
      if (c?.riskSummary?.length) {
        sections += `<h2>Top Risks</h2><table><tr><th>Severity</th><th>Risk</th><th>Status</th></tr>`;
        c.riskSummary.forEach((r: any) => {
          sections += `<tr><td>${esc(r.severity)}</td><td>${esc(r.title)}</td><td>${esc(r.status)}</td></tr>`;
        });
        sections += "</table>";
      }
      if (c?.milestoneProgress?.length) {
        sections += `<h2>Milestone Progress</h2><table><tr><th>Milestone</th><th>Status</th><th>Due Date</th></tr>`;
        c.milestoneProgress.forEach((m: any) => {
          sections += `<tr><td>${esc(m.title)}</td><td>${esc(m.status)}</td><td>${m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—"}</td></tr>`;
        });
        sections += "</table>";
      }
      if (c?.nextSteps?.length) {
        sections += `<h2>Next Steps</h2><ol>`;
        c.nextSteps.forEach((s: string) => { sections += `<li>${esc(s)}</li>`; });
        sections += "</ol>";
      }

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(report.title)}</title>
<style>
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;font-size:14px}
  h1{font-size:22px;margin-bottom:4px} .meta{color:#666;font-size:13px;margin-bottom:24px}
  h2{font-size:16px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-top:24px}
  table{width:100%;border-collapse:collapse;margin:8px 0} th,td{text-align:left;padding:6px 10px;border:1px solid #e5e7eb;font-size:13px}
  th{background:#f9fafb;font-weight:600} p{line-height:1.6} ol{padding-left:20px} li{margin:4px 0}
  @media print{body{margin:0;padding:20px}}
</style></head><body>
<h1>${esc(report.title)}</h1>
<div class="meta">${esc(report.programName || "Portfolio")} &bull; ${new Date(report.createdAt).toLocaleDateString()} &bull; ${esc(report.type)}</div>
${sections}
<script>window.onload=function(){window.print()}</script>
</body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // --- Missing DELETE endpoints ---

  app.delete("/api/risks/:id", async (req, res) => {
    try {
      await storage.deleteRisk(req.params.id);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'risk_deleted', id: req.params.id });
      res.json({ message: "Risk deleted" });
    } catch (error) {
      console.error("Error deleting risk:", error);
      res.status(500).json({ message: "Failed to delete risk" });
    }
  });

  app.delete("/api/milestones/:id", async (req, res) => {
    try {
      await storage.deleteMilestone(req.params.id);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'milestone_deleted', id: req.params.id });
      res.json({ message: "Milestone deleted" });
    } catch (error) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  app.delete("/api/dependencies/:id", async (req, res) => {
    try {
      await storage.deleteDependency(req.params.id);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'dependency_deleted', id: req.params.id });
      res.json({ message: "Dependency deleted" });
    } catch (error) {
      console.error("Error deleting dependency:", error);
      res.status(500).json({ message: "Failed to delete dependency" });
    }
  });

  app.delete("/api/adopters/:id", async (req, res) => {
    try {
      await storage.deleteAdopter(req.params.id);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'adopter_deleted', id: req.params.id });
      res.json({ message: "Adopter deleted" });
    } catch (error) {
      console.error("Error deleting adopter:", error);
      res.status(500).json({ message: "Failed to delete adopter" });
    }
  });

  app.delete("/api/escalations/:id", async (req, res) => {
    try {
      await storage.deleteEscalation(req.params.id);
      const broadcast = (app as any).broadcast;
      if (broadcast) broadcast('data_changed', { type: 'escalation_deleted', id: req.params.id });
      res.json({ message: "Escalation deleted" });
    } catch (error) {
      console.error("Error deleting escalation:", error);
      res.status(500).json({ message: "Failed to delete escalation" });
    }
  });

  app.delete("/api/jira-bepics/:id", async (req, res) => {
    try {
      await storage.deleteJiraBepic(req.params.id);
      res.json({ message: "JIRA Bepic deleted" });
    } catch (error) {
      console.error("Error deleting JIRA bepic:", error);
      res.status(500).json({ message: "Failed to delete JIRA bepic" });
    }
  });

  app.delete("/api/jira-epics/:id", async (req, res) => {
    try {
      await storage.deleteJiraEpic(req.params.id);
      res.json({ message: "JIRA Epic deleted" });
    } catch (error) {
      console.error("Error deleting JIRA epic:", error);
      res.status(500).json({ message: "Failed to delete JIRA epic" });
    }
  });

  app.delete("/api/jira-stories/:id", async (req, res) => {
    try {
      await storage.deleteJiraStory(req.params.id);
      res.json({ message: "JIRA Story deleted" });
    } catch (error) {
      console.error("Error deleting JIRA story:", error);
      res.status(500).json({ message: "Failed to delete JIRA story" });
    }
  });

  app.delete("/api/initiatives/:id", async (req, res) => {
    try {
      await storage.deleteInitiative(req.params.id);
      res.json({ message: "Initiative deleted" });
    } catch (error) {
      console.error("Error deleting initiative:", error);
      res.status(500).json({ message: "Failed to delete initiative" });
    }
  });

  app.delete("/api/program-phases/:id", async (req, res) => {
    try {
      await storage.deleteProgramPhase(req.params.id);
      res.json({ message: "Program phase deleted" });
    } catch (error) {
      console.error("Error deleting program phase:", error);
      res.status(500).json({ message: "Failed to delete program phase" });
    }
  });

  app.delete("/api/phase-stages/:id", async (req, res) => {
    try {
      await storage.deletePhaseStage(req.params.id);
      res.json({ message: "Phase stage deleted" });
    } catch (error) {
      console.error("Error deleting phase stage:", error);
      res.status(500).json({ message: "Failed to delete phase stage" });
    }
  });

  // Global Search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const q = (req.query.q as string || "").toLowerCase().trim();
      if (!q) {
        return res.json({ programs: [], milestones: [], risks: [], todos: [], decisions: [], escalations: [], stakeholders: [], dependencies: [] });
      }

      const [allPrograms, allMilestones, allRisks, allTodos, allDecisions, allEscalations, allStakeholders, allDependencies] = await Promise.all([
        storage.getPrograms(), storage.getMilestones(), storage.getRisks(),
        storage.getTodos(), storage.getDecisions(),
        storage.getEscalations(), storage.getStakeholders(), storage.getDependencies(),
      ]);

      const programNameMap: Record<string, string> = {};
      for (const p of allPrograms) programNameMap[p.id] = p.name;

      const matchPrograms = allPrograms.filter(p => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)).map(p => ({ id: p.id, title: p.name, type: "program" as const, programName: null, matchField: p.name.toLowerCase().includes(q) ? "name" : "description" }));
      const matchMilestones = allMilestones.filter(m => m.title.toLowerCase().includes(q)).map(m => ({ id: m.id, title: m.title, type: "milestone" as const, programName: m.programId ? programNameMap[m.programId] || null : null, matchField: "title" }));
      const matchRisks = allRisks.filter(r => r.title.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)).map(r => ({ id: r.id, title: r.title, type: "risk" as const, programName: r.programId ? programNameMap[r.programId] || null : null, matchField: r.title.toLowerCase().includes(q) ? "title" : "description" }));
      const matchTodos = allTodos.filter(t => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)).map(t => ({ id: t.id, title: t.title, type: "todo" as const, programName: t.programId ? programNameMap[t.programId] || null : null, matchField: t.title.toLowerCase().includes(q) ? "title" : "description" }));
      const matchDecisions = allDecisions.filter(d => d.title.toLowerCase().includes(q) || (d.rationale || "").toLowerCase().includes(q)).map(d => ({ id: d.id, title: d.title, type: "decision" as const, programName: d.programId ? programNameMap[d.programId] || null : null, matchField: d.title.toLowerCase().includes(q) ? "title" : "rationale" }));
      const matchEscalations = allEscalations.filter(e => e.summary.toLowerCase().includes(q)).map(e => ({ id: e.id, title: e.summary, type: "escalation" as const, programName: e.programId ? programNameMap[e.programId] || null : null, matchField: "summary" }));
      const matchStakeholders = allStakeholders.filter(s => s.name.toLowerCase().includes(q) || (s.role || "").toLowerCase().includes(q)).map(s => ({ id: s.id, title: s.name, type: "stakeholder" as const, programName: s.programId ? programNameMap[s.programId] || null : null, matchField: s.name.toLowerCase().includes(q) ? "name" : "role" }));
      const matchDependencies = allDependencies.filter(d => d.title.toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q)).map(d => ({ id: d.id, title: d.title, type: "dependency" as const, programName: d.programId ? programNameMap[d.programId] || null : null, matchField: d.title.toLowerCase().includes(q) ? "title" : "description" }));

      res.json({ programs: matchPrograms, milestones: matchMilestones, risks: matchRisks, todos: matchTodos, decisions: matchDecisions, escalations: matchEscalations, stakeholders: matchStakeholders, dependencies: matchDependencies });
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  // Weekly Status Generator
  app.post("/api/programs/:id/weekly-status", async (req, res) => {
    try {
      const programId = req.params.id;
      const program = await storage.getProgram(programId);
      if (!program) return res.status(404).json({ message: "Program not found" });

      const [milestones, risks, dependencies, escalations] = await Promise.all([
        storage.getMilestones(programId), storage.getRisks(programId),
        storage.getDependencies(programId), storage.getEscalations(programId),
      ]);

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const completedMilestones = milestones.filter(m => m.status === "completed").length;
      const totalMilestones = milestones.length;
      const criticalRisks = risks.filter(r => r.severity === "critical" || r.severity === "high").length;
      const healthScore = totalMilestones > 0 ? Math.round(((completedMilestones / totalMilestones) * 50) + ((1 - Math.min(criticalRisks, 5) / 5) * 50)) : 100 - Math.min(criticalRisks * 10, 50);

      res.json({
        summary: { programName: program.name, status: program.status || "planning", healthScore, totalMilestones, completedMilestones, openRisks: risks.filter(r => r.status !== "resolved" && r.status !== "mitigated").length, criticalRisks },
        completedThisWeek: milestones.filter(m => m.status === "completed" && m.completedDate && new Date(m.completedDate) >= oneWeekAgo).map(m => ({ id: m.id, title: m.title, completedDate: m.completedDate })),
        inProgress: milestones.filter(m => m.status === "in_progress" || m.status === "at_risk").map(m => ({ id: m.id, title: m.title, status: m.status, dueDate: m.dueDate })),
        risksAndBlockers: {
          criticalHighRisks: risks.filter(r => (r.severity === "critical" || r.severity === "high") && r.status !== "resolved" && r.status !== "mitigated").map(r => ({ id: r.id, title: r.title, severity: r.severity, status: r.status })),
          blockedDependencies: dependencies.filter(d => d.status === "blocked").map(d => ({ id: d.id, title: d.title, status: d.status })),
          openEscalations: escalations.filter(e => e.status === "open" || e.status === "in_progress").map(e => ({ id: e.id, title: e.summary, urgency: e.urgency, status: e.status })),
        },
        nextWeekFocus: milestones.filter(m => m.dueDate && m.status !== "completed" && new Date(m.dueDate) >= now && new Date(m.dueDate) <= oneWeekFromNow).map(m => ({ id: m.id, title: m.title, dueDate: m.dueDate })).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()),
        overdueItems: milestones.filter(m => m.dueDate && m.status !== "completed" && new Date(m.dueDate) < now).map(m => ({ id: m.id, title: m.title, dueDate: m.dueDate, daysOverdue: Math.ceil((now.getTime() - new Date(m.dueDate!).getTime()) / (1000 * 60 * 60 * 24)) })),
        generatedAt: now.toISOString(),
      });
    } catch (error) {
      console.error("Error generating weekly status:", error);
      res.status(500).json({ message: "Failed to generate weekly status" });
    }
  });

  // Jira integration routes
  app.get("/api/jira/status", async (req, res) => {
    try {
      if (!jiraService.isConfigured()) return res.json({ connected: false, user: null, projects: [] });
      const user = await jiraService.testConnection();
      const projects = await jiraService.getProjects();
      res.json({ connected: true, user: user.displayName, projects });
    } catch (error) {
      console.error("Error testing Jira connection:", error);
      res.json({ connected: false, user: null, projects: [], error: (error as Error).message });
    }
  });

  app.get("/api/jira/projects", async (req, res) => {
    try {
      const projects = await jiraService.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching Jira projects:", error);
      res.status(500).json({ message: "Failed to fetch Jira projects" });
    }
  });

  app.get("/api/jira/issues", async (req, res) => {
    try {
      const projectKey = req.query.projectKey as string;
      const jql = req.query.jql as string | undefined;
      if (!projectKey) return res.status(400).json({ message: "projectKey query parameter is required" });
      const issues = await jiraService.getIssues(projectKey, jql);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching Jira issues:", error);
      res.status(500).json({ message: "Failed to fetch Jira issues" });
    }
  });

  app.post("/api/jira/issues", async (req, res) => {
    try {
      const { projectKey, summary, description, issueType } = req.body;
      if (!projectKey || !summary) return res.status(400).json({ message: "projectKey and summary are required" });
      const issue = await jiraService.createIssue(projectKey, summary, description || "", issueType || "Task");
      res.status(201).json(issue);
    } catch (error) {
      console.error("Error creating Jira issue:", error);
      res.status(500).json({ message: "Failed to create Jira issue" });
    }
  });

  app.post("/api/jira/sync/:programId", async (req, res) => {
    try {
      const { programId } = req.params;
      const { projectKey } = req.body;
      if (!projectKey) return res.status(400).json({ message: "projectKey is required in request body" });
      const program = await storage.getProgram(programId);
      if (!program) return res.status(404).json({ message: "Program not found" });

      const issues = await jiraService.getIssues(projectKey);
      const existingMilestones = await storage.getMilestones();
      const programMilestones = existingMilestones.filter((m: any) => m.programId === programId);
      const syncedKeys = new Set(programMilestones.filter((m: any) => m.jiraEpicKey).map((m: any) => m.jiraEpicKey));

      let created = 0, updated = 0;
      for (const issue of issues) {
        const jiraStatus = issue.fields.status?.name?.toLowerCase() || "";
        let milestoneStatus: "not_started" | "in_progress" | "completed" | "at_risk" | "delayed" = "not_started";
        if (["done", "closed", "resolved"].includes(jiraStatus)) milestoneStatus = "completed";
        else if (["in progress", "in review"].includes(jiraStatus)) milestoneStatus = "in_progress";

        if (syncedKeys.has(issue.key)) {
          const existing = programMilestones.find((m: any) => m.jiraEpicKey === issue.key);
          if (existing) { await storage.updateMilestone(existing.id, { title: issue.fields.summary, status: milestoneStatus }); updated++; }
        } else {
          await storage.createMilestone({ title: issue.fields.summary, description: `[Jira ${issue.key}] ${issue.fields.issuetype?.name || "Issue"}`, programId, status: milestoneStatus, jiraEpicKey: issue.key, dueDate: issue.fields.duedate ? new Date(issue.fields.duedate) : undefined } as any);
          created++;
        }
      }
      res.json({ message: `Synced ${issues.length} Jira issues: ${created} created, ${updated} updated`, created, updated, total: issues.length });
    } catch (error) {
      console.error("Error syncing Jira issues:", error);
      res.status(500).json({ message: "Failed to sync Jira issues" });
    }
  });

  // Auto-sync: import Jira projects as programs and sync issues as milestones
  app.post("/api/jira/auto-sync", async (req, res) => {
    try {
      const status = await jiraService.testConnection();
      if (!status) return res.json({ synced: false, message: "Jira not connected" });

      const jiraProjects = await jiraService.getProjects();
      const existingPrograms = await storage.getPrograms();

      let programsCreated = 0, programsUpdated = 0, issuesSynced = 0;

      for (const jiraProj of jiraProjects) {
        // Find existing program linked to this Jira project
        let program = existingPrograms.find((p: any) => p.jiraProjectKey === jiraProj.key);

        if (!program) {
          // Create a new program for this Jira project
          program = await storage.createProgram({
            name: jiraProj.name,
            description: `Synced from Jira project ${jiraProj.key}`,
            status: "active",
            jiraProjectKey: jiraProj.key,
          } as any);
          programsCreated++;
        }

        // Sync issues as milestones
        const issues = await jiraService.getIssues(jiraProj.key);
        const existingMilestones = await storage.getMilestones(program.id);
        const syncedKeys = new Set(existingMilestones.filter((m: any) => m.jiraEpicKey).map((m: any) => m.jiraEpicKey));

        for (const issue of issues) {
          // Skip subtasks — only sync top-level issues
          if (issue.fields.issuetype?.name?.toLowerCase() === 'subtask') continue;

          const jiraStatus = issue.fields.status?.name?.toLowerCase() || "";
          let milestoneStatus: "not_started" | "in_progress" | "completed" | "at_risk" | "delayed" = "not_started";
          if (["done", "closed", "resolved"].includes(jiraStatus)) milestoneStatus = "completed";
          else if (["in progress", "in review"].includes(jiraStatus)) milestoneStatus = "in_progress";

          if (syncedKeys.has(issue.key)) {
            const existing = existingMilestones.find((m: any) => m.jiraEpicKey === issue.key);
            if (existing) {
              await storage.updateMilestone(existing.id, { title: issue.fields.summary, status: milestoneStatus });
            }
          } else {
            await storage.createMilestone({
              title: issue.fields.summary,
              description: `[Jira ${issue.key}] ${issue.fields.issuetype?.name || "Issue"}`,
              programId: program.id,
              status: milestoneStatus,
              jiraEpicKey: issue.key,
              dueDate: issue.fields.duedate ? new Date(issue.fields.duedate) : undefined,
            } as any);
            issuesSynced++;
          }
        }
        programsUpdated++;
      }

      // REVERSE SYNC: TPM programs without a Jira project → create Jira project
      let jiraProjectsCreated = 0;
      const refreshedPrograms = await storage.getPrograms();
      const existingJiraKeys = new Set(jiraProjects.map(p => p.key));

      for (const program of refreshedPrograms) {
        if ((program as any).jiraProjectKey) continue; // already linked

        // Generate a Jira project key from program name (max 10 chars, uppercase, alpha only)
        let baseKey = program.name
          .replace(/[^a-zA-Z\s]/g, '')
          .split(/\s+/)
          .map(w => w[0])
          .join('')
          .toUpperCase()
          .substring(0, 6);
        if (baseKey.length < 2) baseKey = program.name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
        if (baseKey.length < 2) baseKey = 'TPM';

        // Ensure unique key
        let key = baseKey;
        let suffix = 1;
        while (existingJiraKeys.has(key)) {
          key = `${baseKey}${suffix}`;
          suffix++;
        }

        try {
          const jiraProject = await jiraService.createProject(program.name, key);
          await storage.updateProgram(program.id, { jiraProjectKey: jiraProject.key } as any);
          existingJiraKeys.add(jiraProject.key);
          jiraProjectsCreated++;

          // Push existing milestones to the new Jira project as issues
          const programMilestones = await storage.getMilestones(program.id);
          for (const ms of programMilestones) {
            if ((ms as any).jiraEpicKey) continue; // already synced
            try {
              const jiraIssue = await jiraService.createIssue(jiraProject.key, ms.title, ms.description || "");
              await storage.updateMilestone(ms.id, { jiraEpicKey: jiraIssue.key } as any);
            } catch (msErr: any) { console.error(`Failed to push milestone "${ms.title}" to Jira:`, msErr?.message); }
          }

          // Push existing risks
          const programRisks = await storage.getRisks(program.id);
          for (const risk of programRisks) {
            if ((risk as any).jiraIssueKey) continue;
            try {
              const desc = `Severity: ${risk.severity || 'unknown'}\n${risk.description || ''}`;
              const jiraIssue = await jiraService.createIssueWithLabels(jiraProject.key, `[Risk] ${risk.title}`, desc, ["risk", risk.severity || "medium"]);
              await storage.updateRisk(risk.id, { jiraIssueKey: jiraIssue.key } as any);
            } catch (rErr: any) { console.error(`Failed to push risk "${risk.title}" to Jira:`, rErr?.message); }
          }
        } catch (projErr: any) {
          console.error(`Failed to create Jira project for "${program.name}":`, projErr?.message);
        }
      }

      (app as any).broadcast('data_changed', { type: 'jira_sync' });
      res.json({
        synced: true,
        programsCreated,
        programsUpdated,
        issuesSynced,
        jiraProjectsCreated,
        totalJiraProjects: jiraProjects.length + jiraProjectsCreated
      });
    } catch (error: any) {
      console.error("Jira auto-sync error:", error);
      res.status(500).json({ synced: false, message: error?.message || "Jira auto-sync failed" });
    }
  });

  // Set a no-op broadcast by default (for serverless environments)
  if (!(app as any).broadcast) {
    (app as any).broadcast = (_eventType: string, _data: any) => {};
  }
}

// Create HTTP server with WebSocket support (for local/traditional hosting)
export async function registerRoutes(app: Express): Promise<Server> {
  registerApiRoutes(app);

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients for broadcasting
  const connectedClients = new Set<WebSocket>();

  // Broadcast function for real-time updates
  const broadcast = (eventType: string, data: any) => {
    console.log(`Broadcasting ${eventType} to ${connectedClients.size} clients:`, data);
    const message = JSON.stringify({ type: eventType, data });
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          console.log('Successfully sent WebSocket message to client');
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          connectedClients.delete(client);
        }
      }
    });
  };

  // Make broadcast function available to routes
  (app as any).broadcast = broadcast;

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    connectedClients.add(ws);

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', data: { timestamp: new Date() } }));

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  return httpServer;
}
