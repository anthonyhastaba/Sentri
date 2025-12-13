# Sentri - AI Incident Triage Dashboard

## Overview

Sentri is an AI-powered security and IT incident triage dashboard. Users can create incident tickets, and the system uses OpenAI (via Replit AI Integrations) to automatically analyze, categorize, prioritize, and draft responses for each ticket. The app follows a full-stack TypeScript architecture with a React frontend and Express backend, connected to a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode by default, cybersecurity-themed color palette)
- **Animations**: Framer Motion for transitions and scanning effects
- **Forms**: React Hook Form with Zod resolvers for validation
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Route Definitions**: Shared route contracts in `shared/routes.ts` define paths, methods, input schemas, and response schemas using Zod — used by both client and server
- **AI Integration**: OpenAI client configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables (Replit AI Integrations). Used for ticket analysis (categorization, priority, next steps, draft responses)
- **Development**: Vite dev server with HMR proxied through Express
- **Production**: Client built to `dist/public/`, server bundled with esbuild to `dist/index.cjs`

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod integration
- **Schema Location**: `shared/schema.ts` (main ticket schema) and `shared/models/chat.ts` (conversations/messages for chat integration)
- **Migrations**: Drizzle Kit with `db:push` command for schema sync
- **Key Tables**:
  - `tickets`: id, title, content, category, priority, status, next_steps, draft_response, created_at
  - `conversations`: id, title, created_at (for chat feature)
  - `messages`: id, conversation_id, role, content, created_at (for chat feature)

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` implementation
- All database access goes through the `storage` singleton — this is the data access layer for tickets

### Replit Integrations
The `server/replit_integrations/` and `client/replit_integrations/` directories contain pre-built integration modules:
- **Chat**: Conversation-based chat with OpenAI (SSE streaming support)
- **Audio**: Voice recording, playback, speech-to-text, and text-to-speech via AudioWorklet
- **Image**: Image generation using `gpt-image-1` model
- **Batch**: Batch processing utility with rate limiting and retries for bulk LLM operations

### Build System
- **Dev**: `npm run dev` — runs tsx with Vite middleware for HMR
- **Build**: `npm run build` — Vite builds client, esbuild bundles server; selective dependency bundling via allowlist to optimize cold start
- **Type Check**: `npm run check` — TypeScript checking across all code
- **DB Push**: `npm run db:push` — pushes Drizzle schema to Postgres

## External Dependencies

### Required Services
- **PostgreSQL**: Primary database, connection string via `DATABASE_URL` environment variable
- **OpenAI API** (via Replit AI Integrations): Used for AI-powered ticket analysis. Requires `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables

### Key NPM Packages
- `express` v5 — HTTP server
- `drizzle-orm` + `drizzle-kit` — Database ORM and migrations
- `openai` — OpenAI API client
- `zod` + `drizzle-zod` — Schema validation and type generation
- `@tanstack/react-query` — Client-side data fetching
- `wouter` — Client-side routing
- `framer-motion` — Animations
- `react-hook-form` + `@hookform/resolvers` — Form handling
- `shadcn/ui` components (Radix UI based)
- `date-fns` — Date formatting
- `connect-pg-simple` — PostgreSQL session store (available but not actively wired)