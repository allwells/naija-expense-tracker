---
name: better-auth
description: better-auth configuration and usage patterns for NaijaExpense. Use when setting up auth.ts, auth-client.ts, the /api/auth/[...all] route, middleware route protection, reading sessions in server actions, or building the login/signup page. Covers environment variables, database connection via pg Pool, session configuration, profile creation post-signup, and the exact patterns for both server-side and client-side session access.
---

# SKILL: better-auth Setup

## Purpose

Configure better-auth for authentication in NaijaExpense. better-auth is the auth library — NOT Supabase Auth.

## Installation

```bash
bun add better-auth
```

## Core Config: `src/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL, // Supabase direct connection string
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // set true in production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  user: {
    additionalFields: {
      // No extra fields needed — profile table handles this
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

## Client: `src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

## API Route: `src/app/api/auth/[...all]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

## Middleware: `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  const isAuthRoute = req.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/expenses") ||
    req.nextUrl.pathname.startsWith("/income") ||
    req.nextUrl.pathname.startsWith("/reports") ||
    req.nextUrl.pathname.startsWith("/settings");

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)",
  ],
};
```

## Usage in Server Actions

```typescript
// In every server action that requires auth:
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function someAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: "Unauthorized" };

  const userId = session.user.id;
  // proceed with userId
}
```

## Usage in Client Components

```typescript
'use client';
import { useSession } from '@/lib/auth-client';

export function SomeComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <Skeleton />;
  if (!session) return null;

  return <div>Hello, {session.user.name}</div>;
}
```

## Login Page Pattern

```tsx
// src/app/login/page.tsx
"use client";
import { signIn, signUp } from "@/lib/auth-client";

// Show email + password form
// On submit: call signIn.email({ email, password, callbackURL: '/dashboard' })
// On sign up: call signUp.email({ email, password, name, callbackURL: '/onboarding' })
// Handle errors: show toast with error message
```

## Profile Creation After Sign Up

Create a profile row immediately after signup using a better-auth hook or in the onboarding page:

```typescript
// Create profile after successful signup
await createProfile({ userId: session.user.id });
// This inserts into profiles table with defaults
```

## Database Tables (better-auth managed)

better-auth creates its own tables. Run `npx @better-auth/cli migrate` to generate and apply them. These will be separate from your app tables.

## Environment Variables Required

```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
BETTER_AUTH_SECRET=generate-with-openssl-rand-hex-32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting DATABASE_URL from Supabase

In Supabase dashboard → Settings → Database → Connection String → select "Transaction" mode for serverless. Use the `postgresql://` URI format.
