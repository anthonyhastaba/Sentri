# Sentri — Incident Triage Dashboard

Security and IT incident triage: create tickets, get AI-generated category, priority, next steps, and draft responses.

- **Stack:** React (Vite), Express, PostgreSQL (Drizzle), OpenAI
- **Deploy:** Railway (see `railway.toml`)

## Run locally

1. **Dependencies:** `npm install`
2. **Env:** Create `.env` with:
   - `DATABASE_URL` — Postgres connection string (e.g. [Neon](https://neon.tech))
   - `OPENAI_API_KEY` — for ticket analysis (optional; app runs without it)
   - `PORT` — optional, default 5000
3. **DB:** `npm run db:push`
4. **Dev:** `npm run dev` → http://localhost:5000 (or your `PORT`)

## Build & production

- **Build:** `npm run build` (client → `dist/public/`, server → `dist/index.cjs`)
- **Start:** `npm start` (uses `PORT`; Railway sets this automatically)

## Env vars (production)

Set in Railway (or your host):

- `DATABASE_URL` — required
- `OPENAI_API_KEY` — optional, for AI analysis
