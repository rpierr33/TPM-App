import {
  users,
  programs,
  milestones,
  risks,
  dependencies,
  adopters,
  escalations,
  integrations,
  reports,
  type User,
  type InsertUser,
  type Program,
  type InsertProgram,
  type Milestone,
  type InsertMilestone,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
    return program;
  }

  async updateProgram(id: string, programData: Partial<InsertProgram>): Promise<Program> {
    const [program] = await db
      .update(programs)
      .set({ ...programData, updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();
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
    const [activeProgramsResult] = await db
      .select({ count: count() })
      .from(programs)
      .where(eq(programs.status, "active"));

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
      activePrograms: activeProgramsResult.count,
      criticalRisks: criticalRisksResult.count,
      upcomingMilestones: upcomingMilestonesResult.count,
      adopterScore: Math.round(avgAdopterScore),
    };
  }
}

export const storage = new DatabaseStorage();
