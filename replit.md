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
The application uses a comprehensive PostgreSQL schema with hierarchical entity relationships:
- **Initiatives**: High-level strategic objectives spanning multiple programs/projects
- **Programs**: Main program entities containing multiple projects
- **Projects**: Project entities belonging to specific programs
- **Initiative-Program/Project Mappings**: Many-to-many relationships with contribution tracking
- **Milestones**: Program/project milestones with PMP phase classification
- **Risks**: Risk management with PMP categories and enhanced program/project associations
- **Stakeholders**: Leadership style and communication preference tracking
- **Stakeholder Interactions**: Predictive response modeling and accuracy tracking
- **PMP Recommendations**: Best practice suggestions based on PMI standards
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

### August 10, 2025
- ✅ **Enhanced Program-Centric Navigation**: Made all program names clickable across ALL component pages
  - Program names in empty state messages now navigate directly to program details
  - Applied to Milestones, Risk Management, Dependencies, and Adopter Support pages
  - Added hover effects and consistent styling for better user experience
- ✅ **Risk Management Program Linkage**: Fixed critical isolation issue in Risk Management page
  - Added dedicated "Program" column to risks table showing clear program association
  - Each risk now displays its linked program/project in clickable badge format
  - Consistent with Dependencies page structure for program relationship visibility
  - Addresses JIRA epic/bepic integration requirements with proper program linking

### January 30, 2025
- ✅ **Complete Program-Centric Dashboard**: Rebuilt dashboard to focus on programs/projects as primary entities
  - Dashboard now centers on active/pending programs as main content
  - ALL displayed components (risks, milestones, dependencies, adopters) are clearly linked to specific programs
  - Each program card shows contextual component counts with critical/overdue indicators
  - Quick actions for critical issues (view critical risks, overdue milestones) per program
  - Simple navigation buttons for accessing all components if needed
- ✅ **Complete Interconnected Component System**: Implemented comprehensive contextual views for ALL components
  - Enhanced backend with contextual API routes for milestones, risks, dependencies, and adopters
  - Created reusable ComponentContextCard and ComponentAnalytics components for consistent data display
  - Added "View Context" functionality to all component tables showing complete related component data
  - Fixed "Check Risks" to show ALL missing components including start/end dates, owners, descriptions, and clarifications
- ✅ **Enhanced Empty State Messages**: Fixed component empty states to show clear program-specific information
  - Empty states now show each program as separate, visually distinct items instead of concatenated strings
  - Color-coded borders for different component types (yellow for milestones, red for risks, etc.)
  - Clear messaging about which specific programs are missing which components
- ✅ **Advanced Component Navigation**: Cross-component navigation with preserved context
  - Added contextual modals for risks, dependencies, and adopters showing full program relationships
  - Implemented program/project tabs and indicators across all dashboard components
  - Cross-navigation between component views maintains program filtering and context
  - Each component view shows comprehensive analytics including health scores and completeness metrics

### January 28, 2025
- ✅ **Enhanced Hierarchical Structure**: Implemented complete program/project/initiative architecture
  - Initiatives: High-level strategic objectives spanning multiple programs/projects
  - Programs: Contain multiple projects with hierarchical relationships
  - Projects: Belong to programs with clear parent-child relationships
  - Many-to-many mappings between initiatives and programs/projects
- ✅ **PMI PMP Best Practices Integration**: Full PMI Project Management Professional standards
  - Five PMP phases: Initiating, Planning, Executing, Monitoring & Controlling, Closing
  - Ten knowledge areas: Integration, Scope, Schedule, Cost, Quality, Resource, Communications, Risk, Procurement, Stakeholder
  - Context-aware recommendations based on project phase and challenges
  - Intelligent next-step suggestions following PMI best practices
- ✅ **Advanced Stakeholder Management**: Leadership style analysis and predictive capabilities
  - Leadership styles: Autocratic, Democratic, Laissez-faire, Transformational, Transactional
  - Communication styles: Direct, Analytical, Expressive, Amiable
  - Predictive response modeling based on historical interactions
  - Learning system that improves accuracy over time
  - Tailored recommendations for stakeholder engagement
- ✅ **Database Schema Enhancement**: Added comprehensive new entity support
  - Projects, initiatives, stakeholders, stakeholder interactions, PMP recommendations
  - Initiative-program and initiative-project mapping tables
  - Enhanced milestones and risks to support both programs and projects
- ✅ **Service Layer Expansion**: New specialized services for advanced features
  - PMPService: Context-aware best practice recommendations
  - StakeholderService: Leadership analysis and response prediction
  - Enhanced AI integration with hierarchical entity support

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