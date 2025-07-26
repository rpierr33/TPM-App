import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const programStatusEnum = pgEnum("program_status", [
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "not_started",
  "in_progress",
  "at_risk",
  "completed",
  "delayed",
]);

export const riskSeverityEnum = pgEnum("risk_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const riskStatusEnum = pgEnum("risk_status", [
  "identified",
  "in_progress",
  "mitigated",
  "resolved",
  "accepted",
]);

export const dependencyStatusEnum = pgEnum("dependency_status", [
  "blocked",
  "at_risk",
  "on_track",
  "completed",
]);

export const adopterStatusEnum = pgEnum("adopter_status", [
  "not_started",
  "in_progress",
  "ready",
  "blocked",
  "completed",
]);

export const escalationUrgencyEnum = pgEnum("escalation_urgency", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const escalationStatusEnum = pgEnum("escalation_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const integrationStatusEnum = pgEnum("integration_status", [
  "connected",
  "limited",
  "disconnected",
  "error",
]);

// Core Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").unique().notNull(),
  role: varchar("role").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  status: programStatusEnum("status").default("planning"),
  ownerId: varchar("owner_id").references(() => users.id),
  objectives: jsonb("objectives"), // Array of OKRs
  kpis: jsonb("kpis"), // Key Performance Indicators
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  programId: varchar("program_id").references(() => programs.id),
  status: milestoneStatusEnum("status").default("not_started"),
  ownerId: varchar("owner_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  jiraEpicKey: varchar("jira_epic_key"), // JIRA integration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const risks = pgTable("risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  programId: varchar("program_id").references(() => programs.id),
  severity: riskSeverityEnum("severity"),
  impact: integer("impact"), // 1-5 scale
  probability: integer("probability"), // 1-5 scale
  status: riskStatusEnum("status").default("identified"),
  ownerId: varchar("owner_id").references(() => users.id),
  mitigationPlan: text("mitigation_plan"),
  dueDate: timestamp("due_date"),
  jiraIssueKey: varchar("jira_issue_key"), // JIRA integration
  aiScore: decimal("ai_score", { precision: 5, scale: 2 }), // AI-predicted risk score
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dependencies = pgTable("dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  programId: varchar("program_id").references(() => programs.id),
  upstreamId: varchar("upstream_id"), // Can reference another program/milestone
  downstreamId: varchar("downstream_id"), // Can reference another program/milestone
  status: dependencyStatusEnum("status").default("on_track"),
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adopters = pgTable("adopters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamName: varchar("team_name").notNull(),
  description: text("description"),
  programId: varchar("program_id").references(() => programs.id),
  status: adopterStatusEnum("status").default("not_started"),
  readinessScore: integer("readiness_score"), // 0-100
  contactId: varchar("contact_id").references(() => users.id),
  onboardingNotes: text("onboarding_notes"),
  lastCheckIn: timestamp("last_check_in"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const escalations = pgTable("escalations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  summary: varchar("summary").notNull(),
  description: text("description"),
  programId: varchar("program_id").references(() => programs.id),
  urgency: escalationUrgencyEnum("urgency"),
  status: escalationStatusEnum("status").default("open"),
  ownerId: varchar("owner_id").references(() => users.id),
  reporterId: varchar("reporter_id").references(() => users.id),
  impact: text("impact"),
  sendToSlack: boolean("send_to_slack").default(false),
  sendToTeams: boolean("send_to_teams").default(false),
  sendToEmail: boolean("send_to_email").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // jira, smartsheet, confluence, slack, teams
  status: integrationStatusEnum("status").default("disconnected"),
  apiUrl: varchar("api_url"),
  apiKey: varchar("api_key"),
  webhookUrl: varchar("webhook_url"),
  lastSync: timestamp("last_sync"),
  config: jsonb("config"), // Integration-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  type: varchar("type").notNull(), // weekly, monthly, quarterly
  programId: varchar("program_id").references(() => programs.id),
  generatedBy: varchar("generated_by").references(() => users.id),
  content: jsonb("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedPrograms: many(programs),
  ownedMilestones: many(milestones),
  ownedRisks: many(risks),
  ownedDependencies: many(dependencies),
  adopterContacts: many(adopters),
  ownedEscalations: many(escalations),
  reportedEscalations: many(escalations),
  generatedReports: many(reports),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  owner: one(users, {
    fields: [programs.ownerId],
    references: [users.id],
  }),
  milestones: many(milestones),
  risks: many(risks),
  dependencies: many(dependencies),
  adopters: many(adopters),
  escalations: many(escalations),
  reports: many(reports),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  program: one(programs, {
    fields: [milestones.programId],
    references: [programs.id],
  }),
  owner: one(users, {
    fields: [milestones.ownerId],
    references: [users.id],
  }),
}));

export const risksRelations = relations(risks, ({ one }) => ({
  program: one(programs, {
    fields: [risks.programId],
    references: [programs.id],
  }),
  owner: one(users, {
    fields: [risks.ownerId],
    references: [users.id],
  }),
}));

export const dependenciesRelations = relations(dependencies, ({ one }) => ({
  program: one(programs, {
    fields: [dependencies.programId],
    references: [programs.id],
  }),
  owner: one(users, {
    fields: [dependencies.ownerId],
    references: [users.id],
  }),
}));

export const adoptersRelations = relations(adopters, ({ one }) => ({
  program: one(programs, {
    fields: [adopters.programId],
    references: [programs.id],
  }),
  contact: one(users, {
    fields: [adopters.contactId],
    references: [users.id],
  }),
}));

export const escalationsRelations = relations(escalations, ({ one }) => ({
  program: one(programs, {
    fields: [escalations.programId],
    references: [programs.id],
  }),
  owner: one(users, {
    fields: [escalations.ownerId],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [escalations.reporterId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  program: one(programs, {
    fields: [reports.programId],
    references: [programs.id],
  }),
  generatedBy: one(users, {
    fields: [reports.generatedBy],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDependencySchema = createInsertSchema(dependencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdopterSchema = createInsertSchema(adopters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEscalationSchema = createInsertSchema(escalations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;

export type Dependency = typeof dependencies.$inferSelect;
export type InsertDependency = z.infer<typeof insertDependencySchema>;

export type Adopter = typeof adopters.$inferSelect;
export type InsertAdopter = z.infer<typeof insertAdopterSchema>;

export type Escalation = typeof escalations.$inferSelect;
export type InsertEscalation = z.infer<typeof insertEscalationSchema>;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// Dashboard metrics type
export type DashboardMetrics = {
  activePrograms: number;
  criticalRisks: number;
  upcomingMilestones: number;
  adopterScore: number;
};
