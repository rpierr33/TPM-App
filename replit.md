# AI-First TPM Automation Platform

## Overview
This is an AI-first Technical Program Manager (TPM) automation web application. It functions as an intelligent assistant, controllable via voice commands and natural language chat, offering comprehensive program management capabilities. Key features include milestone tracking, risk and dependency management, adopter support, escalations, and executive reporting, all accessed through AI interfaces. The platform is designed around the principle that AI should be the primary interface for all functionality, providing proactive analysis, smart suggestions, and daily briefings to enhance program management efficiency and insight. The business vision is to provide an intelligent, automated solution for managing complex technical programs, offering significant market potential by streamlining PMO operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- Consolidated Programs component functionality into Dashboard component
- Eliminated redundant Programs page - all program management now happens through Dashboard
- Added comprehensive program management section with scrollable container for large program lists
- Created "View All Programs" link for when programs exceed dashboard display capacity
- Updated navigation to remove separate Programs menu item - all program access through Dashboard

## System Architecture

### AI-First Design Philosophy
The platform prioritizes AI as the primary interaction method, enabling:
- **Voice Commands**: For creating programs, milestones, risks, and dependencies.
- **Chat Interface**: For inquiries, insights, and proactive recommendations.
- **Proactive Analysis**: Automatic identification of risks, gaps, and improvement opportunities.
- **Smart Suggestions**: Continuous AI-powered recommendations.
- **Daily Briefings**: Automated daily summaries with priorities and alerts.

### Frontend
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter.
- **State Management**: Zustand (global app state) and TanStack Query (server state).
- **UI Components**: Radix UI primitives with shadcn/ui design system.
- **Styling**: Tailwind CSS with a custom TPM-specific color palette.
- **Build Tool**: Vite.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database ORM**: Drizzle ORM with PostgreSQL dialect.
- **Session Management**: Express sessions with PostgreSQL store.
- **API Integration**: OpenAI GPT-4o for AI features.
- **Real-time**: Native WebSocket server.

### Database Schema
A comprehensive PostgreSQL schema supports hierarchical entities:
- **Initiatives**: High-level strategic objectives.
- **Programs**: Main program entities containing projects.
- **Projects**: Project entities belonging to programs.
- **Mappings**: Many-to-many relationships for initiatives, programs, and projects.
- **Milestones**: With PMP phase classification.
- **Risks**: With PMP categories and program/project associations.
- **Stakeholders**: With leadership style and communication preference tracking.
- **Stakeholder Interactions**: Predictive response modeling.
- **PMP Recommendations**: Best practice suggestions based on PMI standards.
- **Dependencies**: Cross-program/milestone dependencies.
- **Adopters**: Team adoption tracking.
- **Escalations**: Issue escalation management.
- **Integrations**: Third-party tool configurations.
- **Reports**: Storage for generated executive reports.

### Key Features and Design Decisions
- **Dual Mode Operation**: `Test Mode` (mock data, simulated integrations) and `Live Mode` (real external services).
- **Dashboard System**: Real-time metrics, risk heatmap, program timeline, active risks table, adopter readiness dashboard, and AI-powered insights.
- **UI Component System**: Consistent design via shadcn/ui, responsive layout, modal system, toast notifications, and React Hook Form with Zod validation.
- **Data Flow**: Frontend uses TanStack Query for API requests, Express server handles requests, Drizzle ORM for database operations, and WebSockets for real-time updates. State management uses Zustand for global state, TanStack Query for server state, and React Hook Form for form state.
- **Architectural Focus**: Highly modular and extensible design with clear separation between test and live environments, comprehensive error handling, and a robust type system.

## External Dependencies

### Core Dependencies
- **Database**: Neon serverless PostgreSQL.
- **AI Service**: OpenAI GPT-4o.
- **UI Library**: Radix UI.
- **Styling**: Tailwind CSS.

### Integration Dependencies (Live Mode)
- **JIRA**: Project management and issue tracking.
- **Slack/Teams**: Communication and notifications.
- **Smartsheet**: Project planning and tracking.
- **Confluence**: Documentation management.