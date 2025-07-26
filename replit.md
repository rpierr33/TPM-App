# AI-First TPM Automation Platform

## Overview

This is an AI-first Technical Program Manager (TPM) automation web application built with a modern full-stack architecture. The application operates as an intelligent assistant that can be controlled entirely through voice commands and natural language chat. It provides comprehensive program management capabilities including milestone tracking, risk management, dependency management, adopter support, escalations, and executive reporting - all accessible through AI interfaces.

## AI-First Design Philosophy

The platform is designed around the principle that AI should be the primary interface for all functionality:

- **Voice Commands**: Create programs, milestones, risks, and dependencies using natural speech
- **Chat Interface**: Ask questions, get insights, and receive proactive recommendations
- **Proactive Analysis**: AI automatically identifies risks, gaps, and improvement opportunities
- **Smart Suggestions**: Continuous AI-powered recommendations for better program management
- **Daily Briefings**: Automated daily summaries with priorities and alerts

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for global app state (mode switching, sidebar state)
- **Data Fetching**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom TPM-specific color palette
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon serverless PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store
- **API Integration**: OpenAI GPT-4o for AI-powered features
- **WebSocket**: Native WebSocket server for real-time updates

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following key entities:
- **Programs**: Main program entities with status tracking
- **Milestones**: Program milestones with due dates and status
- **Risks**: Risk management with severity, probability, and impact scoring
- **Dependencies**: Cross-program/milestone dependencies
- **Adopters**: Team adoption tracking with readiness scores
- **Escalations**: Issue escalation management
- **Integrations**: Third-party tool integration configurations
- **Reports**: Generated executive reports storage

## Key Components

### Dual Mode Operation
- **Test Mode**: Uses mock data and simulated integrations for development/testing
- **Live Mode**: Connects to real external services (JIRA, Slack, Teams, etc.)
- Mode switching available through global app state

### Dashboard System
- Real-time metrics cards showing program health
- Risk heatmap visualization based on probability/impact matrix
- Program timeline with milestone tracking
- Active risks table with JIRA integration capabilities
- Adopter readiness dashboard with team-specific progress
- AI-powered insights and recommendations

### Integration Services
- **JIRA Integration**: Push milestones and risks to JIRA as issues
- **AI Service**: OpenAI integration for text summarization and action item extraction
- **Mock Services**: Comprehensive mock implementations for test mode

### UI Component System
- Consistent design system based on shadcn/ui
- Responsive layout with collapsible sidebar
- Modal system for entity creation and management
- Toast notifications for user feedback
- Form handling with React Hook Form and Zod validation

## Data Flow

### Client-Server Communication
1. Frontend makes API requests through TanStack Query
2. Express server handles requests with proper error handling and logging
3. Drizzle ORM manages database operations with type safety
4. Real-time updates via WebSocket connections for live data

### State Management Flow
1. Global app state (mode, sidebar) managed by Zustand
2. Server state cached and synchronized via TanStack Query
3. Form state managed locally with React Hook Form
4. UI state (modals, filters) managed with React useState

### Integration Flow
1. Test mode uses local mock data and simulated API responses
2. Live mode authenticates with external services via stored credentials
3. AI features process data through OpenAI API with proper error handling
4. JIRA integration pushes items and syncs status bidirectionally

## External Dependencies

### Core Dependencies
- **Database**: Neon serverless PostgreSQL for data persistence
- **AI Service**: OpenAI GPT-4o for intelligent features
- **UI Library**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling

### Integration Dependencies (Live Mode)
- **JIRA**: Project management and issue tracking
- **Slack/Teams**: Communication and notifications
- **Smartsheet**: Project planning and tracking
- **Confluence**: Documentation management

### Development Dependencies
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development server and build tool
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Server-side bundling for production

## Deployment Strategy

### Development Setup
- Vite dev server for frontend with HMR
- tsx for running TypeScript server code directly
- Database migrations handled via Drizzle Kit
- Environment variables for API keys and database URL

### Production Build
- Frontend built with Vite and served as static files
- Server bundled with ESBuild for optimal performance
- Database connection pooling via Neon serverless
- Environment-based configuration for different deployment stages

### Configuration Management
- Database URL required via environment variable
- OpenAI API key for AI features
- Integration credentials stored securely in database
- Mode switching available without redeployment

The application is designed to be highly modular and extensible, with clear separation between test and live environments, comprehensive error handling, and a robust type system throughout the stack.

## Recent Changes

### January 26, 2025
- ✅ **MVP Completion**: Full TPM automation platform is now functional and operational
- ✅ **AI-First Transformation**: Rebuilt as voice and chat-driven application
- ✅ **Voice Interface**: Speech recognition for natural language commands
- ✅ **Chat Assistant**: Conversational AI for program management queries
- ✅ **Proactive Analysis**: AI automatically identifies risks and suggests improvements
- ✅ **Smart Commands**: Voice/text commands for creating programs, milestones, risks
- ✅ **Daily Briefings**: AI-generated status updates with priorities and alerts
- ✅ **Database Setup**: PostgreSQL database configured with comprehensive schema
- ✅ **API Integration**: All 8 core modules connected with working API endpoints
- ✅ **TypeScript Resolution**: Fixed all compilation issues and type safety
- ✅ **Local Deployment**: Created comprehensive local setup guide for user testing
- ✅ **Dual Mode Framework**: Test/Live mode architecture fully implemented