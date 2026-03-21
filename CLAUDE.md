# TPM APP — Claude Code Instructions

## What This App Is

A Technical Program Management platform that multiplies PM efficiency through intelligent prioritization and sequencing. The #1 job: when a PM opens the dashboard, they immediately know what to do first, second, third — across ALL their projects, whether managing 1 or 1,000.

## Architecture

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v3 + shadcn/ui + Zustand (state) + React Query (data)
- **Backend:** Express.js + Drizzle ORM + PostgreSQL (Neon serverless)
- **AI:** Claude API via direct `fetch()` calls (NOT the SDK — it breaks when bundled)
- **Auth:** Clerk (frontend SDK + manual JWT verification on backend via `fetch()` + `crypto.subtle`)
- **Deployment:** Vercel using Build Output API (see below)

## Deployment — CRITICAL

The app deploys via `build-api.mjs` which uses the **Vercel Build Output API**. This is non-standard and easy to break.

- **Entry point:** `server/api-entry.ts` (NOT in `api/` directory — Vercel auto-detects `api/` and overrides our bundle)
- **Build:** `node build-api.mjs` runs: Vite (frontend) → esbuild (server bundle, CJS format) → writes `.vercel/output/`
- **esbuild externals:** Only `bufferutil` and `utf-8-validate` are external. Everything else is bundled inline.
- **No SDK bundling:** The Anthropic SDK and Clerk backend SDK both break when bundled with esbuild. We use raw `fetch()` + `crypto.subtle` instead. See `server/services/ai.ts` (lines 19-49) and `server/middleware/auth.ts` for the pattern.
- **Environment variables on Vercel:** `DATABASE_URL`, `ANTHROPIC_API_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_DOMAIN`

## Key Files

| File | Purpose |
|------|---------|
| `build-api.mjs` | Build script for Vercel — DO NOT use vercel.json buildCommand directly |
| `server/api-entry.ts` | Express entry point (auth middleware → routes) |
| `server/middleware/auth.ts` | JWT verification via Clerk JWKS (no SDK) |
| `server/services/ai.ts` | Claude API via fetch() with drop-in wrapper (lines 19-49) |
| `server/routes.ts` | All ~100 API endpoints |
| `server/storage.ts` | Drizzle ORM database layer |
| `shared/schema.ts` | Database schema (Drizzle + Zod) |
| `client/src/App.tsx` | React root — ClerkProvider + AuthGate + Router |
| `client/src/stores/appStore.ts` | Zustand store (theme, scope, dashboard prefs, chat) |
| `client/src/lib/queryClient.ts` | React Query client with Bearer token injection |
| `client/src/lib/authFetch.ts` | Token getter for auth |
| `client/src/lib/missingComponents.ts` | Shared missing component detection |
| `client/src/components/dashboard/TodaysFocus.tsx` | Priority dashboard hero section |
| `client/src/index.css` | Dark mode CSS overrides (bulk migration pattern) |

## Dark Mode

Dark mode uses CSS-level bulk overrides in `index.css` (NOT per-component `dark:` classes). When adding new UI with hardcoded Tailwind colors like `bg-white`, `text-gray-900`, `bg-red-50`, etc., check that corresponding `.dark` overrides exist in `index.css`. The sidebar is always dark regardless of theme.

## Database

- PostgreSQL on Neon (serverless pooler)
- Schema push: `npx drizzle-kit push`
- Key tables: programs, milestones, risks, dependencies, adopters, escalations, stakeholders, reports, users
- Programs have `disabledComponents` (jsonb) for toggling modules and `dismissedWarnings` (jsonb) for N/A items
- Programs have both `ownerId` (FK to users) and `ownerName` (free text) for owner assignment

## Auth Flow

1. Frontend: `@clerk/clerk-react` ClerkProvider in `main.tsx`, AuthGate in `App.tsx`
2. Token: `useAuth().getToken()` → stored via `setTokenGetter()` → injected in all API requests as Bearer token
3. Backend: `server/middleware/auth.ts` verifies JWT using Clerk JWKS endpoint + `crypto.subtle` (RS256)
4. User sync: First login auto-creates user record in local DB from Clerk profile
5. Dev mode: When `CLERK_DOMAIN` is not set, auth middleware is skipped

## Program Scope

- `programScope` in Zustand store: `'mine'` or `'all'` (default: `'all'`)
- `GET /api/programs?scope=mine` filters by `ownerId` matching the authenticated user
- New programs auto-assigned to authenticated user via `req.auth.userId`

## Per-Program Component Toggles

Programs have `disabledComponents` (jsonb array). Values: `"adopters"`, `"dependencies"`, `"escalations"`, `"jira"`. When disabled:
- Tabs hidden in ProgramDetails
- Gap detection skips the component
- Missing component warnings suppressed

## Missing Component Warnings

Centralized in `client/src/lib/missingComponents.ts`. Each missing item shows "Add" (opens form/navigates) and "N/A" (stores in `dismissedWarnings`). Owner supports "Assign to me" (Clerk user ID) or free text name.

## Rules for Working on This Codebase

1. **Test everything before saying it's done.** Check runtime logs on Vercel after deploy. Hit the endpoints. Don't assume.
2. **Fix issues everywhere, not just one file.** If program cards are bloated on Dashboard, check Programs.tsx and ExecutiveReports.tsx too.
3. **Don't leave dead buttons.** If a button can't work yet, remove it. No stubs, no "Coming Soon" toasts.
4. **Dark mode: check `index.css` overrides** when using any Tailwind color utility (`bg-*-50`, `text-*-700`, `border-*-200`, etc.)
5. **Never bundle SDKs with esbuild** — use `fetch()` directly for external APIs (Anthropic, Clerk).
6. **PUT /api/programs/:id uses allowlist validation**, not Zod schema. Add new fields to the allowlist in `server/routes.ts`.
7. **The AI daily briefing** must return clean text, never raw JSON. Multiple fallback layers exist in `generateDailyBriefing()`.
8. **`max_tokens` for chat is 2048.** Don't lower it — it was cutting off responses.

## Current State (as of 2026-03-21)

- Auth: Clerk working (sign in, sign out, user sync)
- Dashboard: Today's Focus (AI briefing + urgency stats + action items), Program Snapshot, Programs by Priority, PMP Recommendations (collapsed)
- Dark mode: On by default, toggle in header
- All pages functional, no known dead buttons
- Per-program component toggles and dismissible warnings working
- Owner assignment: "Assign to me" + free text
- AI chat: Working via direct fetch() to Anthropic API
