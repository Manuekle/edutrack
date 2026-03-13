# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SIRA** (Sistema Integral de Registro Académico) is a full-stack academic management system built with Next.js App Router, MongoDB, and Prisma. It manages student enrollment, QR-code attendance tracking, class scheduling, and reporting for a Colombian university.

**Stack:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma 6 + MongoDB, NextAuth.js 4 (JWT), Redis (optional caching), Vercel Blob, Nodemailer.

**Package manager:** pnpm

## Commands

```bash
pnpm dev              # Start dev server with Turbopack
pnpm build            # prisma generate + next build
pnpm type-check       # tsc --noEmit
pnpm check            # format:check + type-check
pnpm format           # Prettier write
pnpm seed             # Seed the database via Prisma

# Testing
pnpm test             # Jest unit tests
pnpm test:watch       # Jest watch mode
pnpm test:coverage    # Jest with coverage
pnpm test:api         # API-specific Jest config (tests/api/)
pnpm test:e2e         # Playwright E2E tests
pnpm test:e2e:ui      # Playwright UI mode
pnpm test:all         # Jest + Playwright
```

## Architecture

### Route & Role Structure

The app uses Next.js App Router with role-based route grouping:

```
app/
  api/
    admin/        # Admin-only endpoints (users, subjects, groups, rooms, periods)
    docente/      # Teacher endpoints (groups, attendance, reports, clases)
    estudiante/   # Student endpoints (dashboard, schedule, history)
    auth/         # NextAuth + password reset
    asistencia/   # QR attendance scanning
  dashboard/
    (roles)/
      admin/      # Admin UI pages
      docente/    # Teacher UI pages
      estudiante/ # Student UI pages
```

### Three Roles

- **ADMIN** – manages users, subjects, groups, rooms, bulk CSV imports
- **DOCENTE** (teacher) – manages class sessions, takes attendance via QR, writes logbooks, generates reports
- **ESTUDIANTE** (student) – views schedule, checks attendance history, justifies absences

### API Route Pattern

All API routes follow the same structure:
1. Get + validate session (`getServerSession(authOptions)`)
2. Parse + validate body/query with Zod schema
3. Prisma query
4. Return `{ data, message }` on success or `{ error }` with appropriate HTTP status

Zod schemas for complex routes live in sibling `schema.ts` files (e.g., `app/api/docente/clases/schema.ts`).

### Authentication

`lib/auth.ts` — NextAuth with Credentials provider. JWT strategy with 30-day sessions. Optional Redis caching layer (`lib/redis.ts`, `lib/cache.ts`) that falls back gracefully to direct DB queries. Passwords hashed with bcryptjs (10 rounds). Users have an `isActive` flag that is checked on every sign-in.

### Data Model Key Points (`prisma/schema.prisma`)

- `User` — roles: ADMIN | DOCENTE | ESTUDIANTE; has `institutionalEmail` + `personalEmail`
- `Group` — a class section for a `Subject`; has `Schedule[]`, assigned `teacher`, enrolled `students`
- `Class` — individual session of a Group; holds QR token, attendance counts, status
- `Attendance` — per-student record for a Class; status: PRESENT | ABSENT | LATE | JUSTIFIED
- `AcademicPeriod` — semester definition used by Planning
- `Planning` — links a Group to an academic period with weekly class planning

### Component Organization

`components/ui/` — shadcn/ui primitives (do not modify directly).
Domain components live under `components/admin/`, `components/docente/`, `components/estudiante/`.
Custom hooks in `hooks/` encapsulate data fetching (React Query) for each domain.

### Key Utilities

- `lib/class-converters.ts` — convert Prisma Group/Class records to frontend-friendly shapes
- `lib/time-utils.ts` — schedule time calculations (class start/end, overlap detection)
- `lib/roles.ts` — role enum and constants
- `lib/csv-parser.ts` — bulk user/enrollment CSV parsing

## Environment Variables

See `docs/ENV_VARIABLES.md` for the full list. Required:
- `DATABASE_URL` — MongoDB connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob
- `SMTP_*` — Email delivery

Redis (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) is optional; the app works without it.

## Database

```bash
pnpm prisma db push     # Apply schema changes to dev DB (no migration files)
pnpm prisma generate    # Regenerate Prisma client after schema changes
pnpm seed               # Run prisma/seed.ts
```

`prisma/reset-to-admin.ts` and `prisma/clean-seed.ts` are helper scripts for dev resets.

## Testing Notes

- Unit tests use Jest + JSDOM; Prisma and NextAuth are mocked
- API tests use a separate config (`jest.api.config.cjs`) and live in `tests/api/`
- E2E tests (Playwright) require the dev server running or a separate base URL
- `--passWithNoTests` is set so missing test files don't fail CI
