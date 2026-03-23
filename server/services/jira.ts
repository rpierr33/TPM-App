// Jira REST API service — uses fetch() directly (NO SDK, see CLAUDE.md)
// Credentials read from process.env at call time so it works when vars aren't set

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any;
    status?: { name: string; statusCategory?: { key: string } };
    assignee?: { displayName: string; emailAddress?: string } | null;
    priority?: { name: string; id: string } | null;
    issuetype?: { name: string };
    created?: string;
    updated?: string;
    duedate?: string | null;
    labels?: string[];
    parent?: { key: string; fields?: { summary: string } } | null;
  };
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

interface JiraTransition {
  id: string;
  name: string;
  to: { name: string; id: string };
}

function getCredentials() {
  const domain = process.env.JIRA_DOMAIN;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  return { domain, email, token };
}

function isConfigured(): boolean {
  const { domain, email, token } = getCredentials();
  return !!(domain && email && token);
}

function getAuthHeader(): string {
  const { email, token } = getCredentials();
  if (!email || !token) throw new Error("Jira credentials not configured");
  return "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
}

function getBaseUrl(): string {
  const { domain } = getCredentials();
  if (!domain) throw new Error("JIRA_DOMAIN not configured");
  return `https://${domain}/rest/api/3`;
}

async function jiraFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jira API ${res.status}: ${errText}`);
  }

  // Some endpoints return 204 with no body
  if (res.status === 204) return null;

  return res.json();
}

export const jiraService = {
  isConfigured,

  async testConnection(): Promise<{ displayName: string; emailAddress: string }> {
    const data = await jiraFetch("/myself");
    return { displayName: data.displayName, emailAddress: data.emailAddress };
  },

  async getCurrentAccountId(): Promise<string> {
    const data = await jiraFetch("/myself");
    return data.accountId;
  },

  async createProject(name: string, key: string): Promise<JiraProject> {
    const accountId = await jiraService.getCurrentAccountId();
    const data = await jiraFetch("/project", {
      method: "POST",
      body: JSON.stringify({
        name,
        key: key.toUpperCase(),
        projectTypeKey: "software",
        projectTemplateKey: "com.pyxis.greenhopper.jira:gh-simplified-scrum-classic",
        leadAccountId: accountId,
      }),
    });
    return { id: data.id, key: data.key, name, projectTypeKey: "software" };
  },

  async getProjects(): Promise<JiraProject[]> {
    const data = await jiraFetch("/project");
    return data.map((p: any) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      projectTypeKey: p.projectTypeKey,
    }));
  },

  async getIssues(projectKey: string, jql?: string): Promise<JiraIssue[]> {
    const query = jql || `project = ${projectKey} ORDER BY updated DESC`;
    const fields = "summary,description,status,assignee,priority,issuetype,created,updated,duedate,labels,parent";
    // Use the new /search/jql endpoint (Jira deprecated /search as of 2025)
    const data = await jiraFetch(`/search/jql`, {
      method: "POST",
      body: JSON.stringify({ jql: query, maxResults: 100, fields: fields.split(",") })
    });
    return data.issues || [];
  },

  async getIssue(issueKey: string): Promise<JiraIssue> {
    return jiraFetch(`/issue/${issueKey}?fields=summary,description,status,assignee,priority,issuetype,created,updated,duedate,labels,parent`);
  },

  async createIssue(projectKey: string, summary: string, description: string, issueType: string = "Task"): Promise<JiraIssue> {
    const body = {
      fields: {
        project: { key: projectKey },
        summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: description || "" }],
            },
          ],
        },
        issuetype: { name: issueType },
      },
    };
    const created = await jiraFetch("/issue", {
      method: "POST",
      body: JSON.stringify(body),
    });
    // Fetch the full issue to return complete fields
    return jiraService.getIssue(created.key);
  },

  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    const data = await jiraFetch(`/issue/${issueKey}/transitions`);
    return data.transitions || [];
  },

  async updateIssueStatus(issueKey: string, transitionId: string): Promise<void> {
    await jiraFetch(`/issue/${issueKey}/transitions`, {
      method: "POST",
      body: JSON.stringify({ transition: { id: transitionId } }),
    });
  },

  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<void> {
    await jiraFetch(`/issue/${issueKey}`, {
      method: "PUT",
      body: JSON.stringify({ fields }),
    });
  },

  async addComment(issueKey: string, text: string): Promise<void> {
    await jiraFetch(`/issue/${issueKey}/comment`, {
      method: "POST",
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        },
      }),
    });
  },

  async createIssueWithLabels(projectKey: string, summary: string, description: string, labels: string[], issueType: string = "Task"): Promise<JiraIssue> {
    const body = {
      fields: {
        project: { key: projectKey },
        summary,
        description: {
          type: "doc",
          version: 1,
          content: [{ type: "paragraph", content: [{ type: "text", text: description || "" }] }],
        },
        issuetype: { name: issueType },
        labels,
      },
    };
    const created = await jiraFetch("/issue", { method: "POST", body: JSON.stringify(body) });
    return jiraService.getIssue(created.key);
  },
};
