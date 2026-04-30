# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (requires Node 22 via nvm)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations against DATABASE_URL
pnpm db:push      # Push schema directly (dev only)
pnpm db:studio    # Open Drizzle Studio
```

Node version: always run `nvm use 22` first (pinned in `.nvmrc`).

## Environment Setup

Copy `.env.example` to `.env.local` and fill in all values before running the dev server. Required:
- `DATABASE_URL` — Neon Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — Clerk auth
- `RESEND_API_KEY` — Email sending
- `REPLICATE_API_TOKEN` — AI wallpaper generation
- `NEXT_PUBLIC_POSTHOG_KEY` — Analytics

## Architecture

**Stack:** Next.js 16 App Router · TypeScript 5 (strict) · Tailwind CSS v4 · Clerk auth · Drizzle ORM + Neon Postgres · Vercel AI SDK · Resend · PostHog · Sentry

### Routing
```
app/
  page.tsx              → Landing page (server component, composes all landing/* components)
  create/page.tsx       → Wizard page (server component wrapping WizardContainer)
  (auth)/sign-in/       → Clerk sign-in
  (auth)/sign-up/       → Clerk sign-up
  api/
    leads/              → POST: upsert lead before auth (email + optional wizard data)
    boards/             → GET/POST: user's saved boards (auth required)
    wallpaper/generate/ → POST: Replicate SDXL wallpaper generation
    email/subscribe/    → POST: subscribe to daily emails (auth required)
```

### Key Patterns

**DB initialization is lazy.** Call `getDb()` inside request handlers, never at module level. This prevents build failures when `DATABASE_URL` is not set.

**Same pattern for Resend** — `getResend()` in `lib/email/send.ts`, not a module-level instance.

**Auth flow:** The wizard (`/create`) is public. The email capture modal appears at Step 4 before Clerk auth, capturing the lead even if the user bounces. After Clerk sign-up, wizard data is saved to the `boards` table.

**Middleware** is at `src/middleware.ts` — Next.js 16 calls this "proxy" internally but the file convention still works.

### Component Structure
```
components/
  landing/    → All 11 landing page sections (Navbar through Footer)
  wizard/     → WizardContainer + Step1–4 + LeadCaptureModal
  ui/         → shadcn/ui primitives (button, input, dialog, etc.)
  providers/  → QueryProvider, PosthogProvider (both 'use client')
```

### Wizard State
`useWizard()` hook manages all 4-step state. Shape defined in `src/hooks/use-wizard.ts`. Zod schemas for each step in `src/lib/validations/wizard.ts`.

### Styling
Tailwind v4 — config is in `src/app/globals.css` inside `@theme {}`, not in `tailwind.config.ts`. Brand colors: `bg-sage`, `bg-gold`, `bg-cream`, `bg-forest`. Fonts: `font-display` (Cormorant Garamond), `font-sans` (DM Sans).

### Database Schema
Three tables in `src/lib/db/schema.ts`:
- `leads` — pre-auth email captures (email is unique, upsert on conflict)
- `boards` — completed wizard submissions per Clerk userId
- `emailSubscriptions` — daily email preferences per userId

Migrations live in `/drizzle/`. Run `pnpm db:generate` after schema changes, then `pnpm db:migrate`.

## Pre-commit Hooks
Husky runs: `lint-staged` (ESLint on staged `.ts/.tsx`) + `gitleaks` (secrets scan, if installed). Commits must follow Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.) — enforced by commitlint.
