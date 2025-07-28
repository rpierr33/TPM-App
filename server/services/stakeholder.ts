import { storage } from "../storage";
import type { 
  Stakeholder, 
  StakeholderInteraction, 
  InsertStakeholderInteraction 
} from "@shared/schema";

// Leadership style characteristics and response patterns
const LEADERSHIP_STYLES = {
  'Autocratic': {
    characteristics: ['Directive', 'Decisive', 'Top-down communication', 'Limited delegation'],
    communicationPreferences: ['Brief updates', 'Clear recommendations', 'Direct communication'],
    decisionPatterns: ['Quick decisions', 'Prefers options with clear outcomes', 'Values efficiency'],
    responseTime: 'Fast',
    preferredFormat: 'Executive summary'
  },
  'Democratic': {
    characteristics: ['Collaborative', 'Consensus-seeking', 'Team-oriented', 'Inclusive'],
    communicationPreferences: ['Team discussions', 'Multiple perspectives', 'Collaborative meetings'],
    decisionPatterns: ['Seeks input', 'Considers multiple options', 'Values team buy-in'],
    responseTime: 'Moderate',
    preferredFormat: 'Detailed analysis with options'
  },
  'Laissez-faire': {
    characteristics: ['Hands-off', 'Trusts team autonomy', 'Minimal oversight', 'Flexible'],
    communicationPreferences: ['High-level updates', 'Exception reporting', 'Minimal meetings'],
    decisionPatterns: ['Delegates decisions', 'Prefers team autonomy', 'Intervenes minimally'],
    responseTime: 'Variable',
    preferredFormat: 'Brief status updates'
  },
  'Transformational': {
    characteristics: ['Visionary', 'Inspiring', 'Change-oriented', 'Future-focused'],
    communicationPreferences: ['Strategic discussions', 'Vision alignment', 'Innovation focus'],
    decisionPatterns: ['Strategic thinking', 'Long-term view', 'Innovation emphasis'],
    responseTime: 'Thoughtful',
    preferredFormat: 'Strategic impact analysis'
  },
  'Transactional': {
    characteristics: ['Results-focused', 'Process-oriented', 'Reward-based', 'Structured'],
    communicationPreferences: ['Metrics and KPIs', 'Performance data', 'Clear deliverables'],
    decisionPatterns: ['Data-driven', 'ROI-focused', 'Process adherence'],
    responseTime: 'Systematic',
    preferredFormat: 'Data-driven reports'
  }
};

const COMMUNICATION_STYLES = {
  'Direct': {
    approach: 'Straightforward, factual, no-nonsense',
    preferences: ['Clear action items', 'Bottom-line up front', 'Minimal small talk'],
    avoidances: ['Lengthy explanations', 'Ambiguous language', 'Indecisiveness']
  },
  'Analytical': {
    approach: 'Data-focused, detailed, systematic',
    preferences: ['Supporting data', 'Logical reasoning', 'Thorough analysis'],
    avoidances: ['Emotional appeals', 'Rushed decisions', 'Incomplete information']
  },
  'Expressive': {
    approach: 'Enthusiastic, relationship-focused, big-picture',
    preferences: ['Stories and examples', 'Visual presentations', 'Personal connections'],
    avoidances: ['Too much detail', 'Dry presentations', 'Impersonal communication']
  },
  'Amiable': {
    approach: 'Supportive, patient, team-oriented',
    preferences: ['Consensus building', 'Team impact consideration', 'Gentle approach'],
    avoidances: ['Aggressive tactics', 'Rushed timelines', 'Conflict']
  }
};

interface PredictionContext {
  stakeholder: Stakeholder;
  interactionType: string;
  context: string;
  programId?: string;
  projectId?: string;
}

export class StakeholderService {
  
  async predictStakeholderResponse(context: PredictionContext): Promise<{
    predictedResponse: string;
    confidence: number;
    recommendations: string[];
  }> {
    const { stakeholder, interactionType, context: situationContext } = context;
    
    // Get stakeholder's historical patterns
    const interactions = await storage.getStakeholderInteractions(stakeholder.id);
    const patterns = this.analyzeResponsePatterns(interactions);
    
    // Generate prediction based on leadership and communication styles
    const prediction = this.generatePrediction(stakeholder, interactionType, situationContext, patterns);
    
    // Calculate confidence based on historical accuracy
    const confidence = this.calculateConfidence(stakeholder, patterns);
    
    // Generate tailored recommendations
    const recommendations = this.generateRecommendations(stakeholder, interactionType, situationContext);
    
    return {
      predictedResponse: prediction,
      confidence,
      recommendations
    };
  }
  
  private analyzeResponsePatterns(interactions: StakeholderInteraction[]): any {
    const patterns = {
      responseTime: 'Unknown',
      decisionStyle: 'Unknown',
      communicationPreference: 'Unknown',
      commonConcerns: [] as string[],
      successFactors: [] as string[]
    };
    
    if (interactions.length === 0) return patterns;
    
    // Analyze response times
    const responseTimes = interactions
      .filter(i => i.actualResponse)
      .map(i => {
        const created = new Date(i.createdAt);
        const updated = new Date(i.updatedAt);
        return updated.getTime() - created.getTime();
      });
    
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      patterns.responseTime = avgResponseTime < 24 * 60 * 60 * 1000 ? 'Fast' : 
                             avgResponseTime < 72 * 60 * 60 * 1000 ? 'Moderate' : 'Slow';
    }
    
    // Extract common concerns and success factors
    interactions.forEach(interaction => {
      if (interaction.actualResponse) {
        if (interaction.actualResponse.toLowerCase().includes('concern') || 
            interaction.actualResponse.toLowerCase().includes('risk')) {
          patterns.commonConcerns.push(interaction.context || '');
        }
        if (interaction.actualResponse.toLowerCase().includes('approve') || 
            interaction.actualResponse.toLowerCase().includes('support')) {
          patterns.successFactors.push(interaction.context || '');
        }
      }
    });
    
    return patterns;
  }
  
  private generatePrediction(
    stakeholder: Stakeholder, 
    interactionType: string, 
    context: string, 
    patterns: any
  ): string {
    const leadershipStyle = LEADERSHIP_STYLES[stakeholder.leadershipStyle as keyof typeof LEADERSHIP_STYLES];
    const communicationStyle = COMMUNICATION_STYLES[stakeholder.communicationStyle as keyof typeof COMMUNICATION_STYLES];
    
    let prediction = `Based on ${stakeholder.name}'s ${stakeholder.leadershipStyle} leadership style and ${stakeholder.communicationStyle} communication approach, `;
    
    switch (interactionType.toLowerCase()) {
      case 'decision':
        if (leadershipStyle) {
          prediction += `they will likely ${leadershipStyle.decisionPatterns.join(' and ')}. `;
          prediction += `Expect ${leadershipStyle.responseTime.toLowerCase()} decision-making. `;
        }
        break;
        
      case 'escalation':
        if (stakeholder.leadershipStyle === 'Autocratic') {
          prediction += 'they will want immediate action items and clear resolution steps. ';
        } else if (stakeholder.leadershipStyle === 'Democratic') {
          prediction += 'they will want to understand team impact and seek input on resolution. ';
        }
        break;
        
      case 'status_update':
        if (communicationStyle) {
          prediction += `they prefer ${communicationStyle.preferences.join(' and ')}. `;
          prediction += `Avoid ${communicationStyle.avoidances.join(' and ')}. `;
        }
        break;
        
      default:
        prediction += 'they will respond according to their established patterns. ';
    }
    
    // Add historical context if available
    if (patterns.commonConcerns.length > 0) {
      prediction += `Historically, they have shown concern about similar situations. `;
    }
    
    return prediction;
  }
  
  private calculateConfidence(stakeholder: Stakeholder, patterns: any): number {
    let baseConfidence = 50; // Start with 50% confidence
    
    // Increase confidence if we have historical data
    if (stakeholder.responsePatterns && Object.keys(stakeholder.responsePatterns as any).length > 0) {
      baseConfidence += 20;
    }
    
    // Increase confidence based on predictive score
    if (stakeholder.predictiveScore) {
      baseConfidence += Number(stakeholder.predictiveScore) * 0.3;
    }
    
    // Increase confidence if leadership and communication styles are defined
    if (stakeholder.leadershipStyle && stakeholder.communicationStyle) {
      baseConfidence += 15;
    }
    
    return Math.min(Math.max(baseConfidence, 0), 100);
  }
  
  private generateRecommendations(
    stakeholder: Stakeholder, 
    interactionType: string, 
    context: string
  ): string[] {
    const recommendations: string[] = [];
    const leadershipStyle = LEADERSHIP_STYLES[stakeholder.leadershipStyle as keyof typeof LEADERSHIP_STYLES];
    const communicationStyle = COMMUNICATION_STYLES[stakeholder.communicationStyle as keyof typeof COMMUNICATION_STYLES];
    
    // Leadership style-based recommendations
    if (leadershipStyle) {
      recommendations.push(`Communication approach: ${leadershipStyle.communicationPreferences.join(', ')}`);
      recommendations.push(`Present information in: ${leadershipStyle.preferredFormat}`);
    }
    
    // Communication style-based recommendations
    if (communicationStyle) {
      recommendations.push(`Use ${communicationStyle.approach} approach`);
      recommendations.push(`Include: ${communicationStyle.preferences.join(', ')}`);
      recommendations.push(`Avoid: ${communicationStyle.avoidances.join(', ')}`);
    }
    
    // Interaction type-specific recommendations
    switch (interactionType.toLowerCase()) {
      case 'escalation':
        recommendations.push('Prepare clear action items and timeline');
        recommendations.push('Have solution options ready');
        recommendations.push('Include impact assessment');
        break;
        
      case 'decision':
        recommendations.push('Provide clear recommendation with rationale');
        recommendations.push('Include risk analysis');
        recommendations.push('Present options with pros/cons');
        break;
        
      case 'status_update':
        recommendations.push('Focus on key metrics and progress');
        recommendations.push('Highlight any risks or blockers');
        recommendations.push('Include next steps and timeline');
        break;
    }
    
    return recommendations;
  }
  
  async recordInteraction(interaction: InsertStakeholderInteraction): Promise<StakeholderInteraction> {
    return await storage.createStakeholderInteraction(interaction);
  }
  
  async updateInteractionWithActual(
    id: string, 
    actualResponse: string
  ): Promise<StakeholderInteraction> {
    const interaction = await storage.getStakeholderInteraction(id);
    if (!interaction) {
      throw new Error('Interaction not found');
    }
    
    // Calculate accuracy if we had a prediction
    let accuracy = null;
    if (interaction.predictedResponse) {
      accuracy = this.calculatePredictionAccuracy(interaction.predictedResponse, actualResponse);
    }
    
    const updated = await storage.updateStakeholderInteraction(id, {
      actualResponse,
      accuracy: accuracy ? Number(accuracy.toFixed(2)) : null
    });
    
    // Update stakeholder's predictive score
    if (accuracy !== null) {
      await this.updateStakeholderPredictiveScore(interaction.stakeholderId, accuracy);
    }
    
    return updated;
  }
  
  private calculatePredictionAccuracy(predicted: string, actual: string): number {
    // Simple similarity calculation - in production, use more sophisticated NLP
    const predictedWords = predicted.toLowerCase().split(' ');
    const actualWords = actual.toLowerCase().split(' ');
    
    let matches = 0;
    for (const word of predictedWords) {
      if (actualWords.includes(word)) {
        matches++;
      }
    }
    
    return (matches / Math.max(predictedWords.length, actualWords.length)) * 100;
  }
  
  private async updateStakeholderPredictiveScore(stakeholderId: string, newAccuracy: number): Promise<void> {
    const stakeholder = await storage.getStakeholder(stakeholderId);
    if (!stakeholder) return;
    
    const currentScore = Number(stakeholder.predictiveScore) || 0;
    const updatedScore = (currentScore * 0.8) + (newAccuracy * 0.2); // Weighted average
    
    await storage.updateStakeholder(stakeholderId, {
      predictiveScore: Number(updatedScore.toFixed(2))
    });
  }
  
  async getStakeholderInsights(stakeholderId: string): Promise<{
    stakeholder: Stakeholder;
    recentInteractions: StakeholderInteraction[];
    predictiveAccuracy: number;
    recommendations: string[];
  }> {
    const stakeholder = await storage.getStakeholder(stakeholderId);
    if (!stakeholder) {
      throw new Error('Stakeholder not found');
    }
    
    const interactions = await storage.getStakeholderInteractions(stakeholderId);
    const recentInteractions = interactions.slice(0, 10); // Last 10 interactions
    
    const predictiveAccuracy = Number(stakeholder.predictiveScore) || 0;
    
    const recommendations = this.generateRecommendations(
      stakeholder, 
      'general', 
      'General stakeholder engagement'
    );
    
    return {
      stakeholder,
      recentInteractions,
      predictiveAccuracy,
      recommendations
    };
  }
  
  getLeadershipStyles(): Record<string, any> {
    return LEADERSHIP_STYLES;
  }
  
  getCommunicationStyles(): Record<string, any> {
    return COMMUNICATION_STYLES;
  }
}

export const stakeholderService = new StakeholderService();