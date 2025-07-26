import { storage } from "../storage";
import { Risk, Milestone, Escalation } from "@shared/schema";

export class IntegrationService {
  async pushMilestoneToJira(milestone: Milestone): Promise<string> {
    try {
      const jiraIntegration = await storage.getIntegration("jira");
      
      if (!jiraIntegration || jiraIntegration.status !== "connected") {
        throw new Error("JIRA integration not configured or connected");
      }

      // In a real implementation, this would make actual JIRA API calls
      const jiraApiUrl = jiraIntegration.apiUrl;
      const apiKey = jiraIntegration.apiKey;

      // Mock JIRA API call - replace with actual implementation
      const jiraResponse = await this.mockJiraCreateEpic({
        summary: milestone.title,
        description: milestone.description || "",
        dueDate: milestone.dueDate?.toISOString().split('T')[0]
      });

      return jiraResponse.key;
    } catch (error) {
      console.error("Error pushing milestone to JIRA:", error);
      throw error;
    }
  }

  async pushRiskToJira(risk: Risk): Promise<string> {
    try {
      const jiraIntegration = await storage.getIntegration("jira");
      
      if (!jiraIntegration || jiraIntegration.status !== "connected") {
        throw new Error("JIRA integration not configured or connected");
      }

      // Mock JIRA API call - replace with actual implementation
      const jiraResponse = await this.mockJiraCreateIssue({
        summary: risk.title,
        description: risk.description || "",
        priority: this.mapRiskSeverityToJiraPriority(risk.severity),
        issueType: "Task" // Could be configurable: Task, Bug, Risk
      });

      return jiraResponse.key;
    } catch (error) {
      console.error("Error pushing risk to JIRA:", error);
      throw error;
    }
  }

  async sendEscalation(escalation: Escalation): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      if (escalation.sendToSlack) {
        promises.push(this.sendToSlack(escalation));
      }

      if (escalation.sendToTeams) {
        promises.push(this.sendToTeams(escalation));
      }

      if (escalation.sendToEmail) {
        promises.push(this.sendToEmail(escalation));
      }

      await Promise.allSettled(promises);
    } catch (error) {
      console.error("Error sending escalation:", error);
      throw error;
    }
  }

  private async sendToSlack(escalation: Escalation): Promise<void> {
    try {
      const slackIntegration = await storage.getIntegration("slack");
      
      if (!slackIntegration || slackIntegration.status !== "connected") {
        throw new Error("Slack integration not configured");
      }

      // Mock Slack webhook call - replace with actual implementation
      const message = {
        text: `🚨 Escalation: ${escalation.summary}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Escalation:* ${escalation.summary}\n*Urgency:* ${escalation.urgency}\n*Description:* ${escalation.description}`
            }
          }
        ]
      };

      console.log("Would send to Slack:", message);
      // await fetch(slackIntegration.webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(message)
      // });
    } catch (error) {
      console.error("Error sending to Slack:", error);
      throw error;
    }
  }

  private async sendToTeams(escalation: Escalation): Promise<void> {
    try {
      const teamsIntegration = await storage.getIntegration("teams");
      
      if (!teamsIntegration || teamsIntegration.status !== "connected") {
        throw new Error("Teams integration not configured");
      }

      // Mock Teams webhook call - replace with actual implementation
      const message = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: escalation.urgency === 'critical' ? 'FF0000' : 'FFA500',
        summary: escalation.summary,
        sections: [{
          activityTitle: `Escalation: ${escalation.summary}`,
          activitySubtitle: `Urgency: ${escalation.urgency}`,
          text: escalation.description
        }]
      };

      console.log("Would send to Teams:", message);
    } catch (error) {
      console.error("Error sending to Teams:", error);
      throw error;
    }
  }

  private async sendToEmail(escalation: Escalation): Promise<void> {
    try {
      // Mock email sending - replace with actual email service
      const emailContent = {
        subject: `Program Escalation: ${escalation.summary}`,
        body: `
          Escalation Details:
          
          Summary: ${escalation.summary}
          Urgency: ${escalation.urgency}
          Description: ${escalation.description}
          Impact: ${escalation.impact}
          
          Please review and take appropriate action.
        `
      };

      console.log("Would send email:", emailContent);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  private mapRiskSeverityToJiraPriority(severity: string | null): string {
    switch (severity) {
      case 'critical': return 'Highest';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  }

  // Mock JIRA API methods - replace with actual JIRA API calls
  private async mockJiraCreateEpic(data: any): Promise<{ key: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      key: `PROJ-${Math.floor(Math.random() * 1000)}`
    };
  }

  private async mockJiraCreateIssue(data: any): Promise<{ key: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      key: `RISK-${Math.floor(Math.random() * 1000)}`
    };
  }

  async syncFromJira(): Promise<void> {
    try {
      const jiraIntegration = await storage.getIntegration("jira");
      
      if (!jiraIntegration || jiraIntegration.status !== "connected") {
        console.log("JIRA integration not available for sync");
        return;
      }

      // Mock sync from JIRA - in real implementation, fetch updates from JIRA
      console.log("Syncing updates from JIRA...");
      
      // Update last sync timestamp
      await storage.updateIntegration("jira", {
        lastSync: new Date()
      });
    } catch (error) {
      console.error("Error syncing from JIRA:", error);
      throw error;
    }
  }
}

export const integrationService = new IntegrationService();
