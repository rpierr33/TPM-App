# AI-First TPM Automation Platform

An intelligent Technical Program Manager (TPM) automation web app. AI is the primary interface — use natural language chat or voice commands to manage complex engineering programs.

## What This App Does

| Feature | Description |
|---|---|
| **Program Planning** | Create and manage engineering programs, projects, initiatives, and platforms |
| **Milestone Tracking** | Track deadlines and progress with PMP phase classification |
| **Risk Management** | Identify, categorize, and mitigate risks with a heatmap view |
| **Dependency Tracking** | Monitor cross-team and cross-program dependencies |
| **Adopter Support** | Track team adoption readiness with scoring |
| **Escalations** | Handle issues and blockers with a workflow |
| **Executive Reports** | Generate management-ready reports |
| **AI Assistant** | Chat/voice interface powered by OpenAI GPT-4o to do all of the above via natural language |

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand
- **Backend**: Node.js, Express.js, Drizzle ORM
- **Database**: PostgreSQL (Neon serverless recommended)
- **AI**: OpenAI GPT-4o
- **Real-time**: WebSockets

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or a free [Neon](https://neon.tech) account)
- OpenAI API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/tpm_automation
OPENAI_API_KEY=sk-your-openai-api-key-here
SESSION_SECRET=your-random-session-secret-here
```

### 3. Set Up the Database

```bash
npm run db:push
```

### 4. Start the App

```bash
npm run dev
```

App runs at `http://localhost:5000`

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

## Dual Mode Operation

- **Test Mode**: Uses mock data — no external services needed
- **Live Mode**: Connects to real integrations (JIRA, Slack, Smartsheet, Confluence)

Toggle between modes using the switch in the app header.

## Project Structure

```
├── client/          # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       ├── hooks/       # Custom React hooks
│       └── stores/      # Zustand state management
├── server/          # Express backend
│   ├── services/    # Business logic
│   ├── db.ts        # Database connection
│   ├── storage.ts   # Data access layer
│   └── routes.ts    # API endpoints
├── shared/          # Shared types and schemas
└── package.json
```
