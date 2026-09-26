# CLAUDE.md

Instructions for Claude Code when working in this repository. Keep this file short — architecture and rationale live in `design.md`, not here.

## Project

**Rotations** — a music album tracker. Users save albums they want to listen to, move them to "listened" once they have, rate/note them, and can browse Spotify search results to find albums to add.

This is a from-scratch rewrite of a v1 built with vanilla HTML/CSS/JS + Firebase + Spotify Search API. v1 lives in `/legacy` for reference only — do not edit it, do not import from it.

## Tech stack

- **Next.js (App Router) + TypeScript** — strict mode, no `any` without a `// eslint-disable` and a comment explaining why
- **Tailwind CSS + shadcn/ui** — use shadcn primitives before writing custom components
- **Supabase** — Postgres (schema + migrations in `/supabase/migrations`), Auth, Row Level Security
- **Spotify Web API** — search + (later) OAuth for listening history import
- **Zod** — validate all external data at the boundary: Spotify API responses, Supabase query results used in forms, route handler inputs
- **Vitest + React Testing Library** — unit/component tests
- **Playwright** — e2e tests for critical flows (add album, move to listened, rate)
- **PWA** — installable, works well on mobile browsers (this is a target requirement, not a stretch feature — see design.md)
- Deployed on **Vercel**

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest run
npm run test:watch   # vitest watch mode
npm run test:e2e     # playwright
npm run db:migrate   # apply supabase migrations locally
```

**Before considering any task done: run `typecheck`, `lint`, and `test`. All three must pass.** This is the verification loop — don't ask me to eyeball a diff that hasn't been checked.

## Directory structure

```
/app                  # Next.js App Router pages + route handlers
/components           # shared UI components (shadcn-based)
/lib
  /supabase           # Supabase client setup, typed query helpers
  /spotify            # Spotify API client
  /schemas            # Zod schemas shared across the app
/supabase/migrations  # SQL migrations — never edit an already-applied migration, add a new one
/tests                # Playwright e2e specs
/legacy               # v1 source, reference only, do not touch
```

## Conventions

- Server data fetching goes through `/lib/supabase` query helpers — don't call `supabase.from(...)` directly inside components.
- Every Spotify API response gets parsed through a Zod schema in `/lib/schemas` before it touches component state.
- Prefer server components; only mark a component `"use client"` when it needs interactivity or browser APIs.
- Mobile-first styling — this app needs to feel good on a phone screen before it needs to look good on desktop. Check responsive behavior at 375px width before calling a UI task done.
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`) on every commit.
- Small, focused commits over one giant diff.

## Do not, without asking first

- Modify or delete a Supabase migration that's already been applied
- Change RLS policies
- Add or rotate environment variables / secrets
- Touch anything under `/legacy`
- Add a new major dependency (state management lib, alternative UI kit, etc.) — flag it and ask
- Commit any file containing ".env" somewhere in its name without asking

## Working style

- For anything more than a one-line fix: explore the relevant files first, propose a short plan, then implement.
- If a task is ambiguous, make a reasonable assumption, state it in one line, and proceed — don't stall on a clarifying question unless it would send the work in a genuinely wrong direction.
- Write tests alongside new logic, not as an afterthought at the end of a session.
