import type { Risk, Milestone, Dependency, Adopter } from "@shared/schema";

export interface HealthMetrics {
  score: number;
  status: string;
  color: string;
  breakdown: {
    criticalRisks: number;
    overdueMilestones: number;
    blockedDependencies: number;
    missingComponents: number;
  };
}

export interface HealthInputs {
  risks: Risk[];
  milestones: Milestone[];
  dependencies: Dependency[];
  adopters?: Adopter[];
  missingComponents?: number;
}

/**
 * Centralized health calculation for program health scoring
 * Used consistently across Dashboard, Program Details, and Program Cards
 */
export function calculateProgramHealth(inputs: HealthInputs): HealthMetrics {
  const { risks, milestones, dependencies, missingComponents = 0 } = inputs;
  
  // Count critical issues
  const criticalRisks = risks.filter(r => r.severity === 'high' || r.severity === 'critical').length;
  
  const overdueMilestones = milestones.filter(m => {
    if (!m.dueDate || m.status === 'completed') return false;
    const dueDate = new Date(m.dueDate);
    const today = new Date();
    return dueDate < today;
  }).length;
  
  const blockedDependencies = dependencies.filter(d => d.status === 'blocked').length;
  
  // Calculate health score (starts at 100, deduct points for issues)
  let score = 100;
  score -= criticalRisks * 15;        // Critical risks are major impact
  score -= overdueMilestones * 12;    // Overdue milestones are serious
  score -= blockedDependencies * 8;   // Blocked dependencies slow progress
  score -= missingComponents * 5;     // Missing components affect completeness
  
  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));
  
  // Determine status and color based on score
  let status: string;
  let color: string;
  
  if (score >= 80) {
    status = 'Excellent';
    color = 'text-green-600';
  } else if (score >= 60) {
    status = 'Good';
    color = 'text-blue-600';
  } else if (score >= 40) {
    status = 'Fair';
    color = 'text-yellow-600';
  } else {
    status = 'At Risk';
    color = 'text-red-600';
  }
  
  return {
    score: Math.round(score),
    status,
    color,
    breakdown: {
      criticalRisks,
      overdueMilestones,
      blockedDependencies,
      missingComponents
    }
  };
}

/**
 * Get health badge styling for UI components
 */
export function getHealthBadge(score: number) {
  if (score >= 80) return { label: "Excellent", color: "bg-green-100 text-green-800" };
  if (score >= 60) return { label: "Good", color: "bg-blue-100 text-blue-800" };
  if (score >= 40) return { label: "Fair", color: "bg-yellow-100 text-yellow-800" };
  return { label: "At Risk", color: "bg-red-100 text-red-800" };
}

/**
 * Get health progress bar color
 */
export function getHealthProgressColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}