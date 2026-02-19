# NaijaExpense

Nigerian business expense tracker with 2026 Tax Reform Act compliance.

## Getting Started

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

- Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Database connection string (`DATABASE_URL`)
- Better-auth secret (`BETTER_AUTH_SECRET`)
- Exchange Rate API key (`EXCHANGE_RATE_API_KEY`)

### 2. Database Migration & Seeding

Run the migration script to set up the database schema (tables, RLS policies, storage buckets):

```bash
bun run db:setup
```

Seed the admin user (using credentials from `.env.local`):

```bash
bun run scripts/seed-admin.ts
```

### 3. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- **Expense Tracking**: Log expenses with OCR receipt scanning.
- **Income Tracking**: Record income sources with multi-currency support.
- **Tax Engine**: 2026 Nigeria Tax Reform Act compliance (CIT, PIT, CGT).
- **Reports**: Tax liability breakdown and P&L statements.
- **PWA**: Installable on Android and iOS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, Shadcn/ui (Monochrome Theme)
- **Auth**: better-auth
- **Database**: Supabase (PostgreSQL)
- **Runtime**: Bun

## Project Structure

- `src/app`: App Router pages and layouts
- `src/components`: UI components
- `src/lib`: Utilities, database, auth
- `schema`: SQL migration files
- `scripts`: Helper scripts
