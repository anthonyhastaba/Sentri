# Sentri — Architecture

## Stack

Full-stack TypeScript monorepo: React SPA + Express 5 + PostgreSQL.

- `client/` — React 18 (Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Wouter)
- `server/` — Express 5 API with Vite dev middleware
- `shared/` — Zod schemas and typed route definitions shared by client and server

## Scripts

```bash
npm run dev       # Dev server (Express + Vite HMR) on http://localhost:5000
npm run build     # Build client (Vite → dist/public/) and server (ESBuild → dist/index.cjs)
npm start         # Production server (requires PORT env var)
npm run check     # TypeScript type checking
npm run db:push   # Apply Drizzle schema to PostgreSQL
```

Run `npm run db:push` once before the first `npm run dev`.

## Environment

```
DATABASE_URL=postgresql://...   # Required
OPENAI_API_KEY=sk-proj-...      # Optional — AI analysis returns 503 if absent
PORT=5000                        # Optional — defaults to 5000
```

## Path aliases

| Alias | Resolves to |
|-------|-------------|
| `@/*` | `client/src/*` |
| `@shared/*` | `shared/*` |

## Key files

| File | Role |
|------|------|
| `shared/schema.ts` | Drizzle table definition + Zod insert/select schemas for `tickets` |
| `shared/routes.ts` | Typed API route definitions (paths + Zod request/response schemas) |
| `server/routes.ts` | Express route handlers — CRUD + OpenAI analysis + seed data |
| `server/storage.ts` | `IStorage` interface + `DatabaseStorage` class (Drizzle ORM) |
| `server/db.ts` | Drizzle client setup |
| `client/src/hooks/use-tickets.ts` | TanStack Query hooks for all ticket operations |
| `script/build.ts` | ESBuild + Vite build script |

## Data model

Single table: `tickets`

```
id, title, content          — user-supplied
category, priority,
nextSteps, draftResponse    — AI-generated via gpt-4o
status                      — "new" | "in_progress" | "resolved" | "closed"
createdAt
```

## AI analysis flow

`POST /api/tickets/:id/analyze` → sends title + content to gpt-4o → returns `category`, `priority`, `nextSteps` (8–10 numbered steps), and `draftResponse` (email draft) → stored back to the ticket row.

Bulk analysis (`POST /api/tickets/bulk-analyze`) uses `batchProcess()` in `server/lib/batch/utils.ts` with `concurrency=3` and exponential backoff on rate-limit errors (p-limit + p-retry).

## Build strategy

ESBuild bundles select ESM-only packages (openai, drizzle-orm, express, etc.) into `dist/index.cjs` to avoid `ERR_REQUIRE_ESM` at runtime. The bundle allowlist lives in `script/build.ts` — add new ESM-only deps there.

## Deployment

Railway + Nixpacks. Build: `npm run build`. Start: `npm start`. Set `DATABASE_URL` and `OPENAI_API_KEY`; Railway provides `PORT` automatically.

## Seed data

7 example tickets are inserted on first run when the DB is empty (see `server/routes.ts`).
