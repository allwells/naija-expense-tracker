---
trigger: always_on
---

# Agent Rules

These rules are ABSOLUTE. No exceptions. No deviations. If you are unsure, follow the rule.

---

## 1. Phase Gate Protocol

- You MUST complete one phase fully before starting the next
- At the end of every phase, output the exact confirmation block defined in `docs/prompt.md`
- STOP and wait. Do not generate code for the next phase speculatively
- If the user says anything other than "proceed" / "confirmed" / "continue", do not advance

---

## 2. TypeScript

- `strict: true` in tsconfig — non-negotiable
- ZERO use of `any`. Use `unknown` with type guards, generics, or proper interfaces
- All function parameters and return types must be explicitly typed
- Database query results must be typed against `src/types/database.ts`
- Server action return type: always `Promise<{ data: T | null; error: string | null }>`

---

## 3. Project Structure

- Component folders: kebab-case (`expense-form/`, `dashboard/`)
- Every component folder has an `index.tsx` as its default export
- Hooks go in a `hooks/` subfolder inside the component folder if component-specific
- Shared hooks go in `src/hooks/`
- Services go in `src/lib/`
- Server actions go in `src/app/actions/`
- API routes go in `src/app/api/`
- Types go in `src/types/`
- NO files outside of these defined locations

---

## 4. UI & Styling

- Use Shadcn/ui components for EVERYTHING that Shadcn covers: buttons, inputs, dialogs, sheets, tables, selects, toasts, cards, badges
- NEVER write custom CSS for things Shadcn components handle
- Tailwind utility classes ONLY — zero inline `style={{}}` props
- Mobile-first: base styles for 375px, `md:` for 768px+, `lg:` for 1024px+
- Theme: use the exact CSS variables from `globals.css` — never hardcode colors
- Borders: 2px width everywhere
- Border radius: 0px everywhere (`--radius: 0rem`)
- Font: Geist only — `font-sans` for body, `font-mono` for numbers/code

---

## 5. Data Fetching & Mutations

- **Server Actions** for all data mutations (create, update, delete)
- **React Server Components** for initial data fetching on page load
- **API Routes** only for: auth (`/api/auth/*`), CSV export streaming (`/api/export/*`), exchange rates (`/api/exchange-rates`)
- No `useEffect` + `fetch` to your own API routes for CRUD — use Server Actions
- No client-side Supabase queries for sensitive data — go through server actions

---

## 6. Authentication

- better-auth ONLY — never use Supabase Auth
- `src/middleware.ts` must protect all `/(dashboard)/*` routes
- Unauthenticated requests to protected routes → redirect to `/login`
- Always use `auth.api.getSession()` on the server for session validation in server actions

---

## 7. Tax Engine

- `src/lib/tax-engine.ts` must be a **pure module** — no imports of Supabase, no side effects, no API calls
- Every tax calculation function must have a corresponding unit test in `src/lib/__tests__/tax-engine.test.ts`
- Never hardcode tax thresholds as magic numbers — use named constants at the top of the file
- All monetary values in the tax engine are in NGN (Naira) as `number` — no currency conversion inside the engine

---

## 8. Error Handling

- Every server action wraps logic in try/catch and returns `{ data: null, error: errorMessage }`
- Every page component has an error boundary
- Every data-fetching component has a skeleton loader
- Toast notifications (Shadcn `useToast`) on every mutation success and error
- Network errors show a retry button, not a blank page

---

## 9. Database & Supabase

- NEVER use the Supabase service role key on the client side
- All client-side Supabase usage: anon key only
- Server-side Supabase operations: service role key via `src/lib/supabase.ts` server client
- RLS must be enabled on ALL tables — no table without RLS
- All queries must be filtered by `user_id` equal to the authenticated user's ID

---

## 10. File Naming

| Thing            | Convention                      |
| ---------------- | ------------------------------- |
| React components | PascalCase.tsx                  |
| Hooks            | use-kebab-case.ts               |
| Services / utils | kebab-case.ts                   |
| Types            | kebab-case.ts                   |
| SQL files        | kebab-case.sql                  |
| API routes       | route.ts (Next.js convention)   |
| Page files       | page.tsx (Next.js convention)   |
| Layout files     | layout.tsx (Next.js convention) |

---

## 11. Forbidden Patterns

- ❌ `any` type
- ❌ `// @ts-ignore` or `// @ts-nocheck`
- ❌ `style={{}}` inline styles
- ❌ `useEffect` for data fetching (use RSC or server actions)
- ❌ Client-side Supabase writes without going through a server action
- ❌ Hardcoded color values (use CSS variables)
- ❌ Hardcoded API URLs (use env vars)
- ❌ `console.log` left in production code (use `console.error` for real errors only)
- ❌ Pages Router patterns (`getServerSideProps`, `getStaticProps`) — App Router only
- ❌ Direct fetch to Supabase REST API from client — use the SDK

---

## 12. Commit Hygiene (if using version control)

- One logical unit per commit
- Commit message format: `feat(phase-N): description` or `fix: description`
- Never commit `.env.local` or any file containing secrets

---

## 13. Output Discipline

- **No thinking out loud.** Do not narrate your reasoning, planning, or decision-making process. No "Let me think about...", "I'll start by...", "Now I need to...", or similar.
- **No progress commentary.** Do not describe what you are about to do before doing it. Just do it.
- **No summaries of what you just did** unless it is the formal phase completion block defined in the Phase Confirmation Protocol.
- **Code and files only.** When producing code, output the file content. No preamble, no explanation of the code unless a specific line requires a non-obvious clarification comment inside the code itself.
- **No "Great!", "Sure!", "Absolutely!"** or any affirmation before responses.
- The only permitted prose output during a build phase is: inline code comments, the phase completion block, and direct answers to explicit questions from the user.
