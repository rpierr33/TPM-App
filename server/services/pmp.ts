import { storage } from "../storage";
import type { 
  Program, 
  Project, 
  PmpRecommendation, 
  InsertPmpRecommendation 
} from "@shared/schema";

// PMI PMP Knowledge Areas and Phase mapping
const PMP_PHASES = [
  'Initiating',
  'Planning', 
  'Executing',
  'Monitoring & Controlling',
  'Closing'
];

const PMP_KNOWLEDGE_AREAS = [
  'Integration Management',
  'Scope Management', 
  'Schedule Management',
  'Cost Management',
  'Quality Management',
  'Resource Management',
  'Communications Management',
  'Risk Management',
  'Procurement Management',
  'Stakeholder Management'
];

// PMP best practice recommendations by phase and context
const PMP_BEST_PRACTICES = {
  'Initiating': {
    'Integration Management': [
      'Develop project charter to formally authorize the project',
      'Identify and document stakeholders early in the project',
      'Define project scope at a high level',
      'Establish initial project objectives and constraints'
    ],
    'Stakeholder Management': [
      'Conduct comprehensive stakeholder analysis',
      'Create stakeholder register with influence/interest matrix',
      'Plan stakeholder engagement strategies',
      'Establish communication protocols with key stakeholders'
    ]
  },
  'Planning': {
    'Scope Management': [
      'Create detailed Work Breakdown Structure (WBS)',
      'Define scope baseline with clear acceptance criteria',
      'Establish scope change control process',
      'Validate scope with stakeholders before execution'
    ],
    'Schedule Management': [
      'Develop realistic project schedule using critical path method',
      'Identify schedule dependencies and critical path',
      'Build in appropriate buffers for schedule risks',
      'Establish schedule baseline and change control'
    ],
    'Risk Management': [
      'Conduct comprehensive risk identification workshops',
      'Perform qualitative and quantitative risk analysis',
      'Develop risk response strategies for high-priority risks',
      'Create risk register with ownership assignments'
    ]
  },
  'Executing': {
    'Resource Management': [
      'Acquire and develop the project team effectively',
      'Manage team performance and resolve conflicts promptly',
      'Optimize resource allocation across project activities',
      'Conduct regular team building and development activities'
    ],
    'Communications Management': [
      'Execute communication management plan consistently',
      'Hold regular status meetings with appropriate stakeholders',
      'Maintain transparent project reporting and dashboards',
      'Address communication gaps and conflicts immediately'
    ]
  },
  'Monitoring & Controlling': {
    'Integration Management': [
      'Monitor work performance and compare against baselines',
      'Implement integrated change control process',
      'Update project management plan as needed',
      'Ensure deliverables meet quality standards'
    ],
    'Quality Management': [
      'Perform quality assurance activities regularly',
      'Control quality through inspections and testing',
      'Implement corrective actions for quality issues',
      'Document lessons learned for future projects'
    ]
  },
  'Closing': {
    'Integration Management': [
      'Complete formal project closure activities',
      'Obtain final acceptance of deliverables',
      'Transfer project outputs to operations team',
      'Document lessons learned and best practices'
    ],
    'Procurement Management': [
      'Close all procurement contracts properly',
      'Conduct vendor performance evaluations',
      'Archive procurement documentation',
      'Release project resources back to organization'
    ]
  }
};

interface ProjectContext {
  program?: Program;
  project?: Project;
  currentPhase?: string;
  challenges?: string[];
  recentActivities?: string[];
}

export class PMPService {
  
  async generateRecommendations(context: ProjectContext): Promise<PmpRecommendation[]> {
    const recommendations: InsertPmpRecommendation[] = [];
    
    // Determine current phase if not provided
    const currentPhase = context.currentPhase || this.inferCurrentPhase(context);
    
    // Get relevant knowledge areas based on context
    const relevantAreas = this.getRelevantKnowledgeAreas(context);
    
    // Generate phase-specific recommendations
    for (const area of relevantAreas) {
      const phaseRecommendations = PMP_BEST_PRACTICES[currentPhase]?.[area] || [];
      
      for (const rec of phaseRecommendations) {
        recommendations.push({
          programId: context.program?.id || null,
          projectId: context.project?.id || null,
          pmpPhase: currentPhase,
          knowledgeArea: area,
          recommendation: rec,
          reasoning: `PMI PMP best practice for ${area} during ${currentPhase} phase`,
          priority: this.calculatePriority(rec, context),
          status: 'pending'
        });
      }
    }
    
    // Add context-specific recommendations
    recommendations.push(...this.generateContextSpecificRecommendations(context));
    
    // Create recommendations in database
    const createdRecommendations: PmpRecommendation[] = [];
    for (const rec of recommendations) {
      try {
        const created = await storage.createPmpRecommendation(rec);
        createdRecommendations.push(created);
      } catch (error) {
        console.error('Error creating PMP recommendation:', error);
      }
    }
    
    return createdRecommendations;
  }
  
  private inferCurrentPhase(context: ProjectContext): string {
    const program = context.program;
    const project = context.project;
    
    if (!program && !project) return 'Initiating';
    
    const entity = project || program;
    
    switch (entity?.status) {
      case 'planning':
        return 'Planning';
      case 'active':
        return 'Executing';
      case 'on_hold':
        return 'Monitoring & Controlling';
      case 'completed':
        return 'Closing';
      default:
        return 'Initiating';
    }
  }
  
  private getRelevantKnowledgeAreas(context: ProjectContext): string[] {
    const areas: string[] = [];
    
    // Always include Integration Management
    areas.push('Integration Management');
    
    // Add areas based on context
    if (context.challenges?.some(c => c.toLowerCase().includes('stakeholder'))) {
      areas.push('Stakeholder Management');
    }
    
    if (context.challenges?.some(c => c.toLowerCase().includes('schedule') || c.toLowerCase().includes('delay'))) {
      areas.push('Schedule Management');
    }
    
    if (context.challenges?.some(c => c.toLowerCase().includes('risk'))) {
      areas.push('Risk Management');
    }
    
    if (context.challenges?.some(c => c.toLowerCase().includes('communication'))) {
      areas.push('Communications Management');
    }
    
    if (context.challenges?.some(c => c.toLowerCase().includes('scope'))) {
      areas.push('Scope Management');
    }
    
    // Default relevant areas if none specified
    if (areas.length === 1) {
      areas.push('Stakeholder Management', 'Communications Management', 'Risk Management');
    }
    
    return [...new Set(areas)]; // Remove duplicates
  }
  
  private calculatePriority(recommendation: string, context: ProjectContext): number {
    // Higher priority for recommendations that address current challenges
    if (context.challenges?.some(challenge => 
      recommendation.toLowerCase().includes(challenge.toLowerCase().split(' ')[0])
    )) {
      return 5;
    }
    
    // Medium priority for proactive recommendations
    if (recommendation.includes('Establish') || recommendation.includes('Create') || recommendation.includes('Develop')) {
      return 3;
    }
    
    // Lower priority for maintenance activities
    return 2;
  }
  
  private generateContextSpecificRecommendations(context: ProjectContext): InsertPmpRecommendation[] {
    const recommendations: InsertPmpRecommendation[] = [];
    
    // Risk-based recommendations
    if (context.challenges?.length) {
      recommendations.push({
        programId: context.program?.id || null,
        projectId: context.project?.id || null,
        pmpPhase: this.inferCurrentPhase(context),
        knowledgeArea: 'Risk Management',
        recommendation: `Address current challenges: ${context.challenges.join(', ')}. Implement risk response strategies.`,
        reasoning: 'Context-specific recommendation based on identified challenges',
        priority: 5,
        status: 'pending'
      });
    }
    
    // Stakeholder engagement recommendations
    recommendations.push({
      programId: context.program?.id || null,
      projectId: context.project?.id || null,
      pmpPhase: this.inferCurrentPhase(context),
      knowledgeArea: 'Stakeholder Management',
      recommendation: 'Schedule regular stakeholder check-ins to maintain engagement and gather feedback',
      reasoning: 'Proactive stakeholder management to prevent issues',
      priority: 4,
      status: 'pending'
    });
    
    return recommendations;
  }
  
  async getRecommendationsByEntity(programId?: string, projectId?: string): Promise<PmpRecommendation[]> {
    return await storage.getPmpRecommendations(programId, projectId);
  }
  
  async updateRecommendationStatus(id: string, status: string, feedback?: string): Promise<PmpRecommendation> {
    return await storage.updatePmpRecommendation(id, { 
      status, 
      feedback,
      implementedDate: status === 'implemented' ? new Date() : undefined 
    });
  }
  
  getPMPPhases(): string[] {
    return PMP_PHASES;
  }
  
  getKnowledgeAreas(): string[] {
    return PMP_KNOWLEDGE_AREAS;
  }
}

export const pmpService = new PMPService();