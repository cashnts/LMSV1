# LMS SaaS

Monorepo: **Next.js** (App Router, shadcn-style UI) + **Clerk** (auth) + **NestJS** API + **Supabase** (Postgres, RLS, Storage).

## Setup

1. Create a **Clerk** application and add **Supabase** env vars from your Supabase project.

2. **Clerk ↔ Supabase (required for API + RLS):** In the Clerk Dashboard, create a **JWT template** named exactly `supabase` (use the Supabase preset if available). That template issues Supabase-compatible JWTs so `auth.uid()` in RLS matches your users. Follow [Clerk’s Supabase integration](https://clerk.com/docs/guides/development/integrations/databases/supabase) to finish wiring (including Supabase Dashboard settings for the JWT secret / third-party auth as documented by Clerk).

3. Run database migrations:

   ```bash
   supabase db push
   # or paste SQL from supabase/migrations/20250420000000_init_lms.sql in the SQL editor
   ```

4. Copy [`.env.example`](./.env.example) to `apps/web/.env.local` and `apps/api/.env`. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy anon key), and mirror URL/publishable key on the API as `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`. Use **service role** only on the API for Stripe webhooks.

5. Install and run:

   ```bash
   pnpm install
   pnpm dev:api    # http://localhost:3001/api
   pnpm dev:web    # http://localhost:3000
   ```

   If pnpm blocks install scripts, run `pnpm approve-builds` and retry.

## Clerk + Next.js layout (this repo)

Per the [Clerk App Router quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart):

- [`apps/web/src/proxy.ts`](apps/web/src/proxy.ts) defines `clerkMiddleware()` and the `matcher`.
- [`apps/web/src/middleware.ts`](apps/web/src/middleware.ts) re-exports `proxy.ts` so **Next.js 15** still picks up middleware (Next only auto-loads `middleware.ts`; keep both files).
- [`apps/web/src/app/layout.tsx`](apps/web/src/app/layout.tsx) wraps the app with `<ClerkProvider>` and uses `<Show when="signed-in">` / `<Show when="signed-out">` with `<SignInButton>`, `<SignUpButton>`, and `<UserButton>`.

### If Clerk UI fails to load (`failed_to_load_clerk_ui`, `ui.browser.js`)

- Pause **ad blockers** / strict privacy extensions for `*.clerk.accounts.dev`.
- Confirm you can reach your Clerk frontend API host in the browser (same host as in the error).
- Default dev script uses **webpack** (`pnpm dev`). If problems persist, compare with `pnpm dev:turbo` (Turbopack).
- Double-check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `apps/web/.env.local` matches the Clerk dashboard.

See also: [Clerk script loading troubleshooting](https://clerk.com/docs/guides/development/troubleshooting/script-loading).

## Flow

1. Sign up / sign in (**Clerk** at `/login` and `/sign-up`).
2. **Dashboard**: create an **organization** (you become `owner`).
3. Open the org → create **courses** and **lessons**, upload **videos, pictures, and files** on a lesson page.
4. Publish a course, then go to **My learning**, paste the **course UUID** (from the course URL) and **Enroll**.
5. Open the course from enrollments and **Mark complete** on lessons.

Learners do not need organization membership to enroll in a published course. Organization membership is still only for staff/admin management inside the org.

## API (Nest)

- `GET /api/health`
- `GET/POST /api/organizations` (Bearer: Clerk **Supabase** JWT from template `supabase`)
- `GET/POST/PATCH/DELETE /api/courses`, `/api/lessons`, `/api/enrollments`, `/api/progress`
- `POST /api/billing/stripe/webhook` (Stripe; optional; uses `SUPABASE_SERVICE_ROLE_KEY`)

## Stripe (optional)

Configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Point the webhook to `/api/billing/stripe/webhook`. Checkout sessions should include `metadata.org_id` for org linkage.
