# Local Development Setup Guide

## Prerequisites

Make sure you have the following installed on your local machine:

- **Node.js** (version 18 or later)
- **npm** or **yarn** package manager
- **PostgreSQL** database (version 12 or later)
- **Git** for version control

## Quick Start

### 1. Download the Project

You can download the project files by:
- Using Replit's download feature (go to Files → Download as ZIP)
- Or cloning if you've connected to Git

### 2. Install Dependencies

```bash
cd your-project-folder
npm install
```

### 3. Database Setup

**Option A: Local PostgreSQL**
1. Install PostgreSQL locally
2. Create a new database:
   ```sql
   CREATE DATABASE tpm_automation;
   ```

**Option B: Use Neon (Recommended)**
1. Go to https://neon.tech
2. Create a free account
3. Create a new database
4. Copy the connection string

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tpm_automation
# Or use your Neon connection string:
# DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/tpm_automation

# OpenAI (for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Session Secret (generate a random string)
SESSION_SECRET=your-random-session-secret-here
```

### 5. Database Migration

Push the database schema:

```bash
npm run db:push
```

### 6. Start the Application

```bash
npm run dev
```

The application will be available at: `http://localhost:5000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── stores/         # Zustand state management
├── server/                 # Express backend
│   ├── services/           # Business logic
│   ├── db.ts              # Database connection
│   ├── storage.ts         # Data access layer
│   └── routes.ts          # API endpoints
├── shared/                 # Shared types and schemas
└── package.json           # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Features Included

Your TPM automation platform includes:

✅ **Program Planning** - Create and manage engineering programs
✅ **Milestone Management** - Track progress and deadlines
✅ **Risk Management** - Identify and mitigate risks
✅ **Dependency Tracking** - Monitor cross-team dependencies
✅ **Adopter Support** - Track team adoption with scoring
✅ **Escalation Workflow** - Handle issues and blockers
✅ **Executive Reporting** - Generate management reports
✅ **AI/NLP Features** - Powered by OpenAI for insights

## Dual Mode Operation

The application supports:
- **Test Mode**: Uses mock data for development/testing
- **Live Mode**: Connects to real integrations (JIRA, Slack, etc.)

Switch between modes using the toggle in the application header.

## Troubleshooting

**Database Connection Issues:**
- Verify your DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall settings

**API Errors:**
- Verify your OPENAI_API_KEY is valid
- Check network connectivity

**Build Errors:**
- Delete `node_modules` and run `npm install` again
- Ensure Node.js version is 18+

## Need Help?

- Check the console logs for detailed error messages
- Review the database schema in `shared/schema.ts`
- API endpoints are documented in `server/routes.ts`

## Production Deployment

For production deployment, you can:
1. Build the application: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or Railway
3. Use environment variables for configuration
4. Ensure database is properly configured for production

Your TPM automation platform is enterprise-ready and can scale with your organization's needs!