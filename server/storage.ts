import {
  users,
  platforms,
  programs,
  projects,
  initiatives,
  milestones,
  milestoneSteps,
  jiraBepics,
  jiraEpics,
  jiraStories,
  programPhases,
  phaseStages,
  risks,
  dependencies,
  adopters,
  escalations,
  integrations,
  reports,
  stakeholders,
  stakeholderInteractions,
  pmpRecommendations,
  type User,
  type InsertUser,
  type Platform,
  type InsertPlatform,
  type Program,
  type InsertProgram,
  type Project,
  type InsertProject,
  type Initiative,
  type InsertInitiative,
  type Milestone,
  type InsertMilestone,
  type MilestoneStep,
  type InsertMilestoneStep,
  type JiraBepic,
  type InsertJiraBepic,
  type JiraEpic,
  type InsertJiraEpic,
  type JiraStory,
  type InsertJiraStory,
  type ProgramPhase,
  type InsertProgramPhase,
  type PhaseStage,
  type InsertPhaseStage,
  type Risk,
  type InsertRisk,
  type Dependency,
  type InsertDependency,
  type Adopter,
  type InsertAdopter,
  type Escalation,
  type InsertEscalation,
  type Integration,
  type InsertIntegration,
  type Report,
  type InsertReport,
  type Stakeholder,
  type InsertStakeholder,
  type StakeholderInteraction,
  type InsertStakeholderInteraction,
  type PmpRecommendation,
  type InsertPmpRecommendation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Platform operations
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: string, platform: Partial<InsertPlatform>): Promise<Platform>;
  deletePlatform(id: string): Promise<void>;
  
  // Program operations
  getPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program>;
  deleteProgram(id: string): Promise<void>;
  
  // Milestone operations
  getMilestones(programId?: string): Promise<Milestone[]>;
  getMilestone(id: string): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, milestone: Partial<InsertMilestone>): Promise<Milestone>;
  deleteMilestone(id: string): Promise<void>;
  
  // Milestone Step operations
  getMilestoneSteps(milestoneId?: string): Promise<MilestoneStep[]>;
  getMilestoneStep(id: string): Promise<MilestoneStep | undefined>;
  createMilestoneStep(step: InsertMilestoneStep): Promise<MilestoneStep>;
  updateMilestoneStep(id: string, step: Partial<InsertMilestoneStep>): Promise<MilestoneStep>;
  deleteMilestoneStep(id: string): Promise<void>;
  
  // JIRA Bepic operations
  getJiraBepics(stepId?: string): Promise<JiraBepic[]>;
  getJiraBepic(id: string): Promise<JiraBepic | undefined>;
  createJiraBepic(bepic: InsertJiraBepic): Promise<JiraBepic>;
  updateJiraBepic(id: string, bepic: Partial<InsertJiraBepic>): Promise<JiraBepic>;
  deleteJiraBepic(id: string): Promise<void>;
  
  // JIRA Epic operations
  getJiraEpics(bepicId?: string): Promise<JiraEpic[]>;
  getJiraEpic(id: string): Promise<JiraEpic | undefined>;
  createJiraEpic(epic: InsertJiraEpic): Promise<JiraEpic>;
  updateJiraEpic(id: string, epic: Partial<InsertJiraEpic>): Promise<JiraEpic>;
  deleteJiraEpic(id: string): Promise<void>;
  
  // JIRA Story operations
  getJiraStories(epicId?: string): Promise<JiraStory[]>;
  getJiraStory(id: string): Promise<JiraStory | undefined>;
  createJiraStory(story: InsertJiraStory): Promise<JiraStory>;
  updateJiraStory(id: string, story: Partial<InsertJiraStory>): Promise<JiraStory>;
  deleteJiraStory(id: string): Promise<void>;
  
  // Program Phase operations
  getProgramPhases(programId?: string, projectId?: string): Promise<ProgramPhase[]>;
  getProgramPhase(id: string): Promise<ProgramPhase | undefined>;
  createProgramPhase(phase: InsertProgramPhase): Promise<ProgramPhase>;
  updateProgramPhase(id: string, phase: Partial<InsertProgramPhase>): Promise<ProgramPhase>;
  deleteProgramPhase(id: string): Promise<void>;
  
  // Phase Stage operations
  getPhaseStages(programPhaseId?: string): Promise<PhaseStage[]>;
  getPhaseStage(id: string): Promise<PhaseStage | undefined>;
  createPhaseStage(stage: InsertPhaseStage): Promise<PhaseStage>;
  updatePhaseStage(id: string, stage: Partial<InsertPhaseStage>): Promise<PhaseStage>;
  deletePhaseStage(id: string): Promise<void>;
  
  // Risk operations
  getRisks(programId?: string): Promise<Risk[]>;
  getRisk(id: string): Promise<Risk | undefined>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: string, risk: Partial<InsertRisk>): Promise<Risk>;
  deleteRisk(id: string): Promise<void>;
  
  // Dependency operations
  getDependencies(programId?: string): Promise<Dependency[]>;
  getDependency(id: string): Promise<Dependency | undefined>;
  createDependency(dependency: InsertDependency): Promise<Dependency>;
  updateDependency(id: string, dependency: Partial<InsertDependency>): Promise<Dependency>;
  deleteDependency(id: string): Promise<void>;
  
  // Adopter operations
  getAdopters(programId?: string): Promise<Adopter[]>;
  getAdopter(id: string): Promise<Adopter | undefined>;
  createAdopter(adopter: InsertAdopter): Promise<Adopter>;
  updateAdopter(id: string, adopter: Partial<InsertAdopter>): Promise<Adopter>;
  deleteAdopter(id: string): Promise<void>;
  
  // Escalation operations
  getEscalations(programId?: string): Promise<Escalation[]>;
  getEscalation(id: string): Promise<Escalation | undefined>;
  createEscalation(escalation: InsertEscalation): Promise<Escalation>;
  updateEscalation(id: string, escalation: Partial<InsertEscalation>): Promise<Escalation>;
  deleteEscalation(id: string): Promise<void>;
  
  // Integration operations
  getIntegrations(): Promise<Integration[]>;
  getIntegration(name: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(name: string, integration: Partial<InsertIntegration>): Promise<Integration>;
  
  // Report operations
  getReports(programId?: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    activePrograms: number;
    criticalRisks: number;
    upcomingMilestones: number;
    adopterScore: number;
  }>;

  // Initiative operations
  getInitiatives(): Promise<Initiative[]>;
  getInitiative(id: string): Promise<Initiative | undefined>;
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  updateInitiative(id: string, updates: Partial<InsertInitiative>): Promise<Initiative>;
  deleteInitiative(id: string): Promise<void>;

  // Project operations
  getProjects(programId?: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Stakeholder operations
  getStakeholders(): Promise<Stakeholder[]>;
  getStakeholder(id: string): Promise<Stakeholder | undefined>;
  createStakeholder(stakeholder: InsertStakeholder): Promise<Stakeholder>;
  updateStakeholder(id: string, updates: Partial<InsertStakeholder>): Promise<Stakeholder>;
  deleteStakeholder(id: string): Promise<void>;

  // Stakeholder interaction operations
  getStakeholderInteractions(stakeholderId?: string): Promise<StakeholderInteraction[]>;
  getStakeholderInteraction(id: string): Promise<StakeholderInteraction | undefined>;
  createStakeholderInteraction(interaction: InsertStakeholderInteraction): Promise<StakeholderInteraction>;
  updateStakeholderInteraction(id: string, updates: Partial<InsertStakeholderInteraction>): Promise<StakeholderInteraction>;

  // PMP recommendation operations
  getPmpRecommendations(programId?: string, projectId?: string): Promise<PmpRecommendation[]>;
  createPmpRecommendation(recommendation: InsertPmpRecommendation): Promise<PmpRecommendation>;
  updatePmpRecommendation(id: string, updates: Partial<InsertPmpRecommendation>): Promise<PmpRecommendation>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Platform operations
  async getPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms).orderBy(desc(platforms.createdAt));
  }

  async getPlatform(id: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform;
  }

  async createPlatform(platformData: InsertPlatform): Promise<Platform> {
    const [platform] = await db.insert(platforms).values(platformData).returning();
    return platform;
  }

  async updatePlatform(id: string, platformData: Partial<InsertPlatform>): Promise<Platform> {
    const [platform] = await db
      .update(platforms)
      .set({ ...platformData, updatedAt: new Date() })
      .where(eq(platforms.id, id))
      .returning();
    return platform;
  }

  async deletePlatform(id: string): Promise<void> {
    await db.delete(platforms).where(eq(platforms.id, id));
  }

  // Program operations
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async getProgram(id: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgram(programData: InsertProgram): Promise<Program> {
    const [program] = await db.insert(programs).values(programData).returning();
    
    // Auto-generate risks for missing components
    await this.generateMissingComponentRisks(program.id);
    return program;
  }

  async updateProgram(id: string, programData: Partial<InsertProgram>): Promise<Program> {
    const [program] = await db
      .update(programs)
      .set({ ...programData, updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();
    
    // Auto-generate/update risks for missing components after update
    await this.generateMissingComponentRisks(program.id);
    return program;
  }

  async deleteProgram(id: string): Promise<void> {
    await db.delete(programs).where(eq(programs.id, id));
  }

  // Milestone operations
  async getMilestones(programId?: string): Promise<Milestone[]> {
    if (programId) {
      return await db.select().from(milestones).where(eq(milestones.programId, programId));
    }
    return await db.select().from(milestones).orderBy(desc(milestones.dueDate));
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone;
  }

  async createMilestone(milestoneData: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db.insert(milestones).values(milestoneData).returning();
    return milestone;
  }

  async updateMilestone(id: string, milestoneData: Partial<InsertMilestone>): Promise<Milestone> {
    const [milestone] = await db
      .update(milestones)
      .set({ ...milestoneData, updatedAt: new Date() })
      .where(eq(milestones.id, id))
      .returning();
    return milestone;
  }

  async deleteMilestone(id: string): Promise<void> {
    await db.delete(milestones).where(eq(milestones.id, id));
  }

  // Milestone Step operations
  async getMilestoneSteps(milestoneId?: string): Promise<MilestoneStep[]> {
    if (milestoneId) {
      return await db.select().from(milestoneSteps).where(eq(milestoneSteps.milestoneId, milestoneId));
    }
    return await db.select().from(milestoneSteps).orderBy(desc(milestoneSteps.dueDate));
  }

  async getMilestoneStep(id: string): Promise<MilestoneStep | undefined> {
    const [step] = await db.select().from(milestoneSteps).where(eq(milestoneSteps.id, id));
    return step;
  }

  async createMilestoneStep(stepData: InsertMilestoneStep): Promise<MilestoneStep> {
    const [step] = await db.insert(milestoneSteps).values(stepData).returning();
    return step;
  }

  async updateMilestoneStep(id: string, stepData: Partial<InsertMilestoneStep>): Promise<MilestoneStep> {
    const [step] = await db
      .update(milestoneSteps)
      .set({ ...stepData, updatedAt: new Date() })
      .where(eq(milestoneSteps.id, id))
      .returning();
    return step;
  }

  async deleteMilestoneStep(id: string): Promise<void> {
    await db.delete(milestoneSteps).where(eq(milestoneSteps.id, id));
  }

  // JIRA Bepic operations
  async getJiraBepics(stepId?: string): Promise<JiraBepic[]> {
    if (stepId) {
      return await db.select().from(jiraBepics).where(eq(jiraBepics.stepId, stepId));
    }
    return await db.select().from(jiraBepics).orderBy(desc(jiraBepics.dueDate));
  }

  async getJiraBepic(id: string): Promise<JiraBepic | undefined> {
    const [bepic] = await db.select().from(jiraBepics).where(eq(jiraBepics.id, id));
    return bepic;
  }

  async createJiraBepic(bepicData: InsertJiraBepic): Promise<JiraBepic> {
    const [bepic] = await db.insert(jiraBepics).values(bepicData).returning();
    return bepic;
  }

  async updateJiraBepic(id: string, bepicData: Partial<InsertJiraBepic>): Promise<JiraBepic> {
    const [bepic] = await db
      .update(jiraBepics)
      .set({ ...bepicData, updatedAt: new Date() })
      .where(eq(jiraBepics.id, id))
      .returning();
    return bepic;
  }

  async deleteJiraBepic(id: string): Promise<void> {
    await db.delete(jiraBepics).where(eq(jiraBepics.id, id));
  }

  // JIRA Epic operations
  async getJiraEpics(bepicId?: string): Promise<JiraEpic[]> {
    if (bepicId) {
      return await db.select().from(jiraEpics).where(eq(jiraEpics.bepicId, bepicId));
    }
    return await db.select().from(jiraEpics).orderBy(desc(jiraEpics.dueDate));
  }

  async getJiraEpic(id: string): Promise<JiraEpic | undefined> {
    const [epic] = await db.select().from(jiraEpics).where(eq(jiraEpics.id, id));
    return epic;
  }

  async createJiraEpic(epicData: InsertJiraEpic): Promise<JiraEpic> {
    const [epic] = await db.insert(jiraEpics).values(epicData).returning();
    return epic;
  }

  async updateJiraEpic(id: string, epicData: Partial<InsertJiraEpic>): Promise<JiraEpic> {
    const [epic] = await db
      .update(jiraEpics)
      .set({ ...epicData, updatedAt: new Date() })
      .where(eq(jiraEpics.id, id))
      .returning();
    return epic;
  }

  async deleteJiraEpic(id: string): Promise<void> {
    await db.delete(jiraEpics).where(eq(jiraEpics.id, id));
  }

  // JIRA Story operations
  async getJiraStories(epicId?: string): Promise<JiraStory[]> {
    if (epicId) {
      return await db.select().from(jiraStories).where(eq(jiraStories.epicId, epicId));
    }
    return await db.select().from(jiraStories).orderBy(desc(jiraStories.dueDate));
  }

  async getJiraStory(id: string): Promise<JiraStory | undefined> {
    const [story] = await db.select().from(jiraStories).where(eq(jiraStories.id, id));
    return story;
  }

  async createJiraStory(storyData: InsertJiraStory): Promise<JiraStory> {
    const [story] = await db.insert(jiraStories).values(storyData).returning();
    return story;
  }

  async updateJiraStory(id: string, storyData: Partial<InsertJiraStory>): Promise<JiraStory> {
    const [story] = await db
      .update(jiraStories)
      .set({ ...storyData, updatedAt: new Date() })
      .where(eq(jiraStories.id, id))
      .returning();
    return story;
  }

  async deleteJiraStory(id: string): Promise<void> {
    await db.delete(jiraStories).where(eq(jiraStories.id, id));
  }

  // Program Phase operations
  async getProgramPhases(programId?: string, projectId?: string): Promise<ProgramPhase[]> {
    if (programId) {
      return await db.select().from(programPhases).where(eq(programPhases.programId, programId));
    }
    if (projectId) {
      return await db.select().from(programPhases).where(eq(programPhases.projectId, projectId));
    }
    return await db.select().from(programPhases).orderBy(desc(programPhases.createdAt));
  }

  async getProgramPhase(id: string): Promise<ProgramPhase | undefined> {
    const [phase] = await db.select().from(programPhases).where(eq(programPhases.id, id));
    return phase;
  }

  async createProgramPhase(phaseData: InsertProgramPhase): Promise<ProgramPhase> {
    const [phase] = await db.insert(programPhases).values(phaseData).returning();
    return phase;
  }

  async updateProgramPhase(id: string, phaseData: Partial<InsertProgramPhase>): Promise<ProgramPhase> {
    const [phase] = await db
      .update(programPhases)
      .set({ ...phaseData, updatedAt: new Date() })
      .where(eq(programPhases.id, id))
      .returning();
    return phase;
  }

  async deleteProgramPhase(id: string): Promise<void> {
    await db.delete(programPhases).where(eq(programPhases.id, id));
  }

  // Phase Stage operations
  async getPhaseStages(programPhaseId?: string): Promise<PhaseStage[]> {
    if (programPhaseId) {
      return await db.select().from(phaseStages).where(eq(phaseStages.programPhaseId, programPhaseId));
    }
    return await db.select().from(phaseStages).orderBy(desc(phaseStages.createdAt));
  }

  async getPhaseStage(id: string): Promise<PhaseStage | undefined> {
    const [stage] = await db.select().from(phaseStages).where(eq(phaseStages.id, id));
    return stage;
  }

  async createPhaseStage(stageData: InsertPhaseStage): Promise<PhaseStage> {
    const [stage] = await db.insert(phaseStages).values(stageData).returning();
    return stage;
  }

  async updatePhaseStage(id: string, stageData: Partial<InsertPhaseStage>): Promise<PhaseStage> {
    const [stage] = await db
      .update(phaseStages)
      .set({ ...stageData, updatedAt: new Date() })
      .where(eq(phaseStages.id, id))
      .returning();
    return stage;
  }

  async deletePhaseStage(id: string): Promise<void> {
    await db.delete(phaseStages).where(eq(phaseStages.id, id));
  }

  // Risk operations
  async getRisks(programId?: string): Promise<Risk[]> {
    if (programId) {
      return await db.select().from(risks).where(eq(risks.programId, programId));
    }
    return await db.select().from(risks).orderBy(desc(risks.createdAt));
  }

  async getRisk(id: string): Promise<Risk | undefined> {
    const [risk] = await db.select().from(risks).where(eq(risks.id, id));
    return risk;
  }

  async createRisk(riskData: InsertRisk): Promise<Risk> {
    const [risk] = await db.insert(risks).values(riskData).returning();
    return risk;
  }

  async updateRisk(id: string, riskData: Partial<InsertRisk>): Promise<Risk> {
    const [risk] = await db
      .update(risks)
      .set({ ...riskData, updatedAt: new Date() })
      .where(eq(risks.id, id))
      .returning();
    return risk;
  }

  async deleteRisk(id: string): Promise<void> {
    await db.delete(risks).where(eq(risks.id, id));
  }

  // Dependency operations
  async getDependencies(programId?: string): Promise<Dependency[]> {
    if (programId) {
      return await db.select().from(dependencies).where(eq(dependencies.programId, programId));
    }
    return await db.select().from(dependencies).orderBy(desc(dependencies.createdAt));
  }

  async getDependency(id: string): Promise<Dependency | undefined> {
    const [dependency] = await db.select().from(dependencies).where(eq(dependencies.id, id));
    return dependency;
  }

  async createDependency(dependencyData: InsertDependency): Promise<Dependency> {
    const [dependency] = await db.insert(dependencies).values(dependencyData).returning();
    return dependency;
  }

  async updateDependency(id: string, dependencyData: Partial<InsertDependency>): Promise<Dependency> {
    const [dependency] = await db
      .update(dependencies)
      .set({ ...dependencyData, updatedAt: new Date() })
      .where(eq(dependencies.id, id))
      .returning();
    return dependency;
  }

  async deleteDependency(id: string): Promise<void> {
    await db.delete(dependencies).where(eq(dependencies.id, id));
  }

  // Adopter operations
  async getAdopters(programId?: string): Promise<Adopter[]> {
    if (programId) {
      return await db.select().from(adopters).where(eq(adopters.programId, programId));
    }
    return await db.select().from(adopters).orderBy(desc(adopters.createdAt));
  }

  async getAdopter(id: string): Promise<Adopter | undefined> {
    const [adopter] = await db.select().from(adopters).where(eq(adopters.id, id));
    return adopter;
  }

  async createAdopter(adopterData: InsertAdopter): Promise<Adopter> {
    const [adopter] = await db.insert(adopters).values(adopterData).returning();
    return adopter;
  }

  async updateAdopter(id: string, adopterData: Partial<InsertAdopter>): Promise<Adopter> {
    const [adopter] = await db
      .update(adopters)
      .set({ ...adopterData, updatedAt: new Date() })
      .where(eq(adopters.id, id))
      .returning();
    return adopter;
  }

  async deleteAdopter(id: string): Promise<void> {
    await db.delete(adopters).where(eq(adopters.id, id));
  }

  // Escalation operations
  async getEscalations(programId?: string): Promise<Escalation[]> {
    if (programId) {
      return await db.select().from(escalations).where(eq(escalations.programId, programId));
    }
    return await db.select().from(escalations).orderBy(desc(escalations.createdAt));
  }

  async getEscalation(id: string): Promise<Escalation | undefined> {
    const [escalation] = await db.select().from(escalations).where(eq(escalations.id, id));
    return escalation;
  }

  async createEscalation(escalationData: InsertEscalation): Promise<Escalation> {
    const [escalation] = await db.insert(escalations).values(escalationData).returning();
    return escalation;
  }

  async updateEscalation(id: string, escalationData: Partial<InsertEscalation>): Promise<Escalation> {
    const [escalation] = await db
      .update(escalations)
      .set({ ...escalationData, updatedAt: new Date() })
      .where(eq(escalations.id, id))
      .returning();
    return escalation;
  }

  async deleteEscalation(id: string): Promise<void> {
    await db.delete(escalations).where(eq(escalations.id, id));
  }

  // Integration operations
  async getIntegrations(): Promise<Integration[]> {
    return await db.select().from(integrations);
  }

  async getIntegration(name: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.name, name));
    return integration;
  }

  async createIntegration(integrationData: InsertIntegration): Promise<Integration> {
    const [integration] = await db.insert(integrations).values(integrationData).returning();
    return integration;
  }

  async updateIntegration(name: string, integrationData: Partial<InsertIntegration>): Promise<Integration> {
    const [integration] = await db
      .update(integrations)
      .set({ ...integrationData, updatedAt: new Date() })
      .where(eq(integrations.name, name))
      .returning();
    return integration;
  }

  // Report operations
  async getReports(programId?: string): Promise<Report[]> {
    if (programId) {
      return await db.select().from(reports).where(eq(reports.programId, programId));
    }
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async createReport(reportData: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(reportData).returning();
    return report;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    activePrograms: number;
    criticalRisks: number;
    upcomingMilestones: number;
    adopterScore: number;
  }> {
    // Get all programs and count them manually for better reliability
    const allPrograms = await db.select().from(programs);
    const activeProgramsCount = allPrograms.filter(p => 
      p.status === "active" || p.status === "planning"
    ).length;

    const [criticalRisksResult] = await db
      .select({ count: count() })
      .from(risks)
      .where(or(eq(risks.severity, "high"), eq(risks.severity, "critical")));

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const [upcomingMilestonesResult] = await db
      .select({ count: count() })
      .from(milestones)
      .where(and(
        gte(milestones.dueDate, new Date()),
        lte(milestones.dueDate, nextWeek)
      ));

    const adoptersData = await db.select({ readinessScore: adopters.readinessScore }).from(adopters);
    const avgAdopterScore = adoptersData.length > 0 
      ? adoptersData.reduce((sum, a) => sum + (a.readinessScore || 0), 0) / adoptersData.length
      : 0;

    return {
      activePrograms: activeProgramsCount,
      criticalRisks: criticalRisksResult.count,
      upcomingMilestones: upcomingMilestonesResult.count,
      adopterScore: Math.round(avgAdopterScore),
    };
  }

  // Initiative operations
  async getInitiatives(): Promise<Initiative[]> {
    return await db.select().from(initiatives).orderBy(desc(initiatives.createdAt));
  }

  async getInitiative(id: string): Promise<Initiative | undefined> {
    const [initiative] = await db.select().from(initiatives).where(eq(initiatives.id, id));
    return initiative;
  }

  async createInitiative(initiativeData: InsertInitiative): Promise<Initiative> {
    const [initiative] = await db.insert(initiatives).values(initiativeData).returning();
    return initiative;
  }

  async updateInitiative(id: string, initiativeData: Partial<InsertInitiative>): Promise<Initiative> {
    const [initiative] = await db
      .update(initiatives)
      .set({ ...initiativeData, updatedAt: new Date() })
      .where(eq(initiatives.id, id))
      .returning();
    return initiative;
  }

  async deleteInitiative(id: string): Promise<void> {
    await db.delete(initiatives).where(eq(initiatives.id, id));
  }

  // Project operations
  async getProjects(programId?: string): Promise<Project[]> {
    if (programId) {
      return await db.select().from(projects).where(eq(projects.programId, programId));
    }
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Stakeholder operations
  async getStakeholders(): Promise<Stakeholder[]> {
    return await db.select().from(stakeholders).orderBy(desc(stakeholders.createdAt));
  }

  async getStakeholder(id: string): Promise<Stakeholder | undefined> {
    const [stakeholder] = await db.select().from(stakeholders).where(eq(stakeholders.id, id));
    return stakeholder;
  }

  async createStakeholder(stakeholderData: InsertStakeholder): Promise<Stakeholder> {
    const [stakeholder] = await db.insert(stakeholders).values(stakeholderData).returning();
    return stakeholder;
  }

  async updateStakeholder(id: string, stakeholderData: Partial<InsertStakeholder>): Promise<Stakeholder> {
    const [stakeholder] = await db
      .update(stakeholders)
      .set({ ...stakeholderData, updatedAt: new Date() })
      .where(eq(stakeholders.id, id))
      .returning();
    return stakeholder;
  }

  async deleteStakeholder(id: string): Promise<void> {
    await db.delete(stakeholders).where(eq(stakeholders.id, id));
  }

  // Stakeholder interaction operations
  async getStakeholderInteractions(stakeholderId?: string): Promise<StakeholderInteraction[]> {
    if (stakeholderId) {
      return await db.select().from(stakeholderInteractions)
        .where(eq(stakeholderInteractions.stakeholderId, stakeholderId))
        .orderBy(desc(stakeholderInteractions.createdAt));
    }
    return await db.select().from(stakeholderInteractions).orderBy(desc(stakeholderInteractions.createdAt));
  }

  async getStakeholderInteraction(id: string): Promise<StakeholderInteraction | undefined> {
    const [interaction] = await db.select().from(stakeholderInteractions).where(eq(stakeholderInteractions.id, id));
    return interaction;
  }

  async createStakeholderInteraction(interactionData: InsertStakeholderInteraction): Promise<StakeholderInteraction> {
    const [interaction] = await db.insert(stakeholderInteractions).values(interactionData).returning();
    return interaction;
  }

  async updateStakeholderInteraction(id: string, interactionData: Partial<InsertStakeholderInteraction>): Promise<StakeholderInteraction> {
    const [interaction] = await db
      .update(stakeholderInteractions)
      .set({ ...interactionData, updatedAt: new Date() })
      .where(eq(stakeholderInteractions.id, id))
      .returning();
    return interaction;
  }

  // PMP recommendation operations
  async getPmpRecommendations(programId?: string, projectId?: string): Promise<PmpRecommendation[]> {
    const conditions = [];
    if (programId) conditions.push(eq(pmpRecommendations.programId, programId));
    if (projectId) conditions.push(eq(pmpRecommendations.projectId, projectId));
    
    if (conditions.length > 0) {
      return await db.select().from(pmpRecommendations)
        .where(and(...conditions))
        .orderBy(desc(pmpRecommendations.priority), desc(pmpRecommendations.createdAt));
    }
    return await db.select().from(pmpRecommendations).orderBy(desc(pmpRecommendations.priority), desc(pmpRecommendations.createdAt));
  }

  async createPmpRecommendation(recommendationData: InsertPmpRecommendation): Promise<PmpRecommendation> {
    const [recommendation] = await db.insert(pmpRecommendations).values(recommendationData).returning();
    return recommendation;
  }

  async updatePmpRecommendation(id: string, recommendationData: Partial<InsertPmpRecommendation>): Promise<PmpRecommendation> {
    const [recommendation] = await db
      .update(pmpRecommendations)
      .set({ ...recommendationData, updatedAt: new Date() })
      .where(eq(pmpRecommendations.id, id))
      .returning();
    return recommendation;
  }

  // Import risks from JIRA (Live mode)
  async importJiraRisks(programId: string): Promise<Risk[]> {
    // TODO: Implement actual JIRA API integration
    // This would query JIRA for issues tagged as risks or blockers
    // For now, return empty array - to be implemented in Live mode
    console.log(`JIRA risk import requested for program: ${programId}`);
    return [];
  }

  // Automatic gap detection and risk generation
  async detectAllProgramGaps(programId: string): Promise<void> {
    await this.generateMissingComponentRisks(programId);
    await this.generateTimelineRisks(programId);
    await this.generateDependencyRisks(programId);
    await this.generateResourceRisks(programId);
  }

  // Generate timeline-related risks
  async generateTimelineRisks(programId: string): Promise<void> {
    const program = await this.getProgram(programId);
    const milestones = await this.getMilestones(programId);
    if (!program) return;

    const risks = [];
    const today = new Date();

    // Check for overdue milestones
    const overdueMilestones = milestones.filter(m => 
      m.dueDate && new Date(m.dueDate) < today && m.status !== 'completed'
    );

    if (overdueMilestones.length > 0) {
      risks.push({
        title: 'Overdue Milestones Risk',
        description: `${overdueMilestones.length} milestone(s) are overdue. This may impact overall program timeline and deliverables.`,
        programId,
        severity: 'high' as const,
        impact: 4,
        probability: 5,
        status: 'identified' as const,
        pmpCategory: 'schedule'
      });
    }

    // Check for milestones too close together
    const sortedMilestones = milestones
      .filter(m => m.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    for (let i = 0; i < sortedMilestones.length - 1; i++) {
      const current = sortedMilestones[i];
      const next = sortedMilestones[i + 1];
      const timeDiff = new Date(next.dueDate!).getTime() - new Date(current.dueDate!).getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (daysDiff < 7) { // Less than a week between milestones
        risks.push({
          title: 'Compressed Timeline Risk',
          description: `Milestones "${current.title}" and "${next.title}" are scheduled too close together (${Math.floor(daysDiff)} days). This may create resource conflicts.`,
          programId,
          severity: 'medium' as const,
          impact: 3,
          probability: 4,
          status: 'identified' as const,
          pmpCategory: 'schedule'
        });
      }
    }

    // Create risks that don't already exist
    for (const risk of risks) {
      await this.createRiskIfNotExists(risk);
    }
  }

  // Generate dependency-related risks
  async generateDependencyRisks(programId: string): Promise<void> {
    const dependencies = await this.getDependencies(programId);
    const risks = [];

    // Check for blocked dependencies
    const blockedDependencies = dependencies.filter(d => d.status === 'blocked');
    if (blockedDependencies.length > 0) {
      risks.push({
        title: 'Blocked Dependencies Risk',
        description: `${blockedDependencies.length} critical dependencies are blocked. This may delay program milestones and deliverables.`,
        programId,
        severity: 'high' as const,
        impact: 4,
        probability: 4,
        status: 'identified' as const,
        pmpCategory: 'scope'
      });
    }

    // Check for dependencies with no owner
    const unownedDependencies = dependencies.filter(d => !d.ownerId);
    if (unownedDependencies.length > 0) {
      risks.push({
        title: 'Unassigned Dependencies Risk',
        description: `${unownedDependencies.length} dependencies have no assigned owner. This creates accountability gaps.`,
        programId,
        severity: 'medium' as const,
        impact: 3,
        probability: 4,
        status: 'identified' as const,
        pmpCategory: 'resources'
      });
    }

    for (const risk of risks) {
      await this.createRiskIfNotExists(risk);
    }
  }

  // Generate resource-related risks
  async generateResourceRisks(programId: string): Promise<void> {
    const adopters = await this.getAdopters(programId);
    const milestones = await this.getMilestones(programId);
    const risks = [];

    // Check for adopters with poor readiness
    const poorReadinessAdopters = adopters.filter(a => (a.readinessScore || 0) < 50);
    if (poorReadinessAdopters.length > 0) {
      risks.push({
        title: 'Low Adopter Readiness Risk',
        description: `${poorReadinessAdopters.length} adopter team(s) have low readiness scores (<50%). This may impact adoption success.`,
        programId,
        severity: 'medium' as const,
        impact: 3,
        probability: 4,
        status: 'identified' as const,
        pmpCategory: 'resources'
      });
    }

    // Check for milestones with no owner
    const unownedMilestones = milestones.filter(m => !m.ownerId);
    if (unownedMilestones.length > 0) {
      risks.push({
        title: 'Unassigned Milestones Risk',
        description: `${unownedMilestones.length} milestone(s) have no assigned owner. This creates accountability and delivery risks.`,
        programId,
        severity: 'high' as const,
        impact: 4,
        probability: 4,
        status: 'identified' as const,
        pmpCategory: 'resources'
      });
    }

    for (const risk of risks) {
      await this.createRiskIfNotExists(risk);
    }
  }

  // Helper method to create risk only if it doesn't exist
  async createRiskIfNotExists(riskData: any): Promise<Risk | null> {
    const existingRisks = await this.getRisks(riskData.programId);
    const exists = existingRisks.some(r => r.title === riskData.title);
    
    if (!exists) {
      return await this.createRisk(riskData);
    }
    return null;
  }

  // Auto-generate risks for missing program components
  async generateMissingComponentRisks(programId: string): Promise<void> {
    const program = await this.getProgram(programId);
    if (!program) return;

    const programRisks = await this.getRisks(programId);
    const programMilestones = await this.getMilestones(programId);
    const programAdopters = await this.getAdopters(programId);

    // Define missing components and their corresponding risk details
    const missingComponents = [];
    
    if (!program.description || program.description.trim().length < 10) {
      missingComponents.push({
        component: 'Description',
        title: 'Missing Program Description',
        description: 'Program lacks adequate description. This creates ambiguity in scope, objectives, and stakeholder understanding.',
        severity: 'medium' as const,
        impact: 3,
        probability: 4
      });
    }
    
    if (!program.ownerId) {
      missingComponents.push({
        component: 'Owner',
        title: 'Missing Program Owner',
        description: 'Program has no assigned owner. This creates accountability gaps and decision-making delays.',
        severity: 'high' as const,
        impact: 4,
        probability: 4
      });
    }
    
    if (!program.startDate) {
      missingComponents.push({
        component: 'Start Date',
        title: 'Missing Program Start Date',
        description: 'Program lacks defined start date. This impacts timeline planning and resource allocation.',
        severity: 'medium' as const,
        impact: 3,
        probability: 4
      });
    }
    
    if (!program.endDate) {
      missingComponents.push({
        component: 'End Date',
        title: 'Missing Program End Date',
        description: 'Program lacks defined end date. This creates uncertainty in deliverable expectations and resource planning.',
        severity: 'medium' as const,
        impact: 3,
        probability: 4
      });
    }
    
    if (!program.objectives || (Array.isArray(program.objectives) && !program.objectives.length)) {
      missingComponents.push({
        component: 'Objectives',
        title: 'Missing Program Objectives',
        description: 'Program lacks clearly defined objectives. This creates alignment issues and success measurement challenges.',
        severity: 'high' as const,
        impact: 4,
        probability: 5
      });
    }
    
    if (!program.kpis || (Array.isArray(program.kpis) && !program.kpis.length)) {
      missingComponents.push({
        component: 'KPIs',
        title: 'Missing Key Performance Indicators',
        description: 'Program lacks defined KPIs. This prevents proper success measurement and progress tracking.',
        severity: 'medium' as const,
        impact: 3,
        probability: 4
      });
    }
    
    if (programMilestones.length === 0) {
      missingComponents.push({
        component: 'Milestones',
        title: 'Missing Program Milestones',
        description: 'Program has no defined milestones. This creates issues with progress tracking and timeline management.',
        severity: 'high' as const,
        impact: 4,
        probability: 5
      });
    }
    
    if (programAdopters.length === 0) {
      missingComponents.push({
        component: 'Adopter Teams',
        title: 'Missing Adopter Teams',
        description: 'Program has no identified adopter teams. This creates adoption risk and change management challenges.',
        severity: 'medium' as const,
        impact: 3,
        probability: 3
      });
    }

    // Remove existing "Missing" risks that might be resolved
    const existingMissingRisks = programRisks.filter(r => 
      r.title?.startsWith('Missing ') && 
      r.description?.includes('Program lacks') || r.description?.includes('Program has no')
    );
    
    for (const risk of existingMissingRisks) {
      const componentName = risk.title?.replace('Missing Program ', '').replace('Missing Key Performance Indicators', 'KPIs').replace('Missing ', '');
      const stillMissing = missingComponents.some(mc => mc.component === componentName);
      
      if (!stillMissing) {
        // Component is no longer missing, remove the risk
        await this.deleteRisk(risk.id);
      }
    }

    // Create risks for components that are missing and don't already have risks
    for (const missing of missingComponents) {
      const existingRisk = programRisks.find(r => 
        r.title === missing.title || 
        (r.title?.includes(missing.component) && r.description?.includes('Program lacks'))
      );
      
      if (!existingRisk) {
        await this.createRisk({
          title: missing.title,
          description: missing.description,
          programId: programId,
          severity: missing.severity,
          impact: missing.impact,
          probability: missing.probability,
          status: 'identified',
          pmpCategory: 'scope'
        });
      }
    }
  }
}

export const storage = new DatabaseStorage();
