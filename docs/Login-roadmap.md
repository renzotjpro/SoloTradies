# Authentication Roadmap: Supabase Login & Signup

## Project Overview
**Target Project:** SoloTradies — `smart-invoice-frontend` (Next.js 16)

**Target State:** Full authentication using Supabase Auth — supports Google OAuth and email/password signup with a `profiles` table storing tradie-specific fields (Business Name, ABN, role). Auth pages have a clean, sidebar-free layout. Middleware protects all routes automatically.

---

## Strategic Goals
1. **Security:** Replace the current open-access frontend with Supabase-managed authentication (JWT sessions, secure cookies).
2. **Multi-Provider:** Support Google login from day one, with Instagram as a visible-but-disabled future option.
3. **Tradie Identity:** Capture `business_name` and `abn` at signup and store in `public.profiles` — linked to `auth.users`.
4. **Future-Proofing:** The `profiles` table includes `instagram_username` as a placeholder column for social OAuth expansion.
5. **Clean UX:** Auth pages (login, signup) use a dedicated layout — no sidebar, no bottom nav.

---

## Architecture Decision: `@supabase/ssr` (Recommended)

> Use the newer `@supabase/ssr` package — **not** the deprecated `@supabase/auth-helpers-nextjs`.

| Package | Status | Use |
|---|---|---|
| `@supabase/ssr` | ✅ Current | This project |
| `@supabase/auth-helpers-nextjs` | ⛔ Deprecated | Avoid |

The `@supabase/ssr` package handles session management via cookies and works with both the Next.js App Router and Middleware.

---

## Database Schema

### `public.profiles`
Links to `auth.users` via a UUID foreign key.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | References `auth.users(id)` — **not** a serial int |
| `full_name` | `text` | Nullable |
| `business_name` | `text` | Collected at signup |
| `abn` | `text` | Australian Business Number (11 digits) |
| `role` | `text` | Default: `'tradie'` |
| `instagram_username` | `text` | Placeholder for future Instagram OAuth |
| `created_at` | `timestamptz` | Auto — `now()` |
| `updated_at` | `timestamptz` | Auto — `now()` |

**Auto-creation trigger:** A `handle_new_user()` trigger on `auth.users` fires on `INSERT` and creates a `profiles` row automatically. This means both Google and email signups get a profile record without any extra code.

---

## SQL to Run in Supabase (SQL Editor)

```sql
-- 1. Profiles table
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text,
  business_name     text,
  abn               text,
  role              text not null default 'tradie',
  instagram_username text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2. Row Level Security — users can only read/edit their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Auto-create profile on new user signup (reads all fields from metadata)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, business_name, abn)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'business_name',
    new.raw_user_meta_data ->> 'abn'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## File Structure to Create

```
smart-invoice-frontend/
├── middleware.ts                          ← NEW: session refresh + route guard
├── .env.local                             ← NEW: Supabase keys (never commit)
└── src/
    ├── lib/
    │   └── supabase/
    │       ├── client.ts                  ← NEW: browser Supabase client
    │       └── server.ts                  ← NEW: server Supabase client
    ├── app/
    │   └── (auth)/                        ← NEW: route group (no sidebar layout)
    │       ├── layout.tsx                 ← NEW: clean auth layout
    │       ├── callback/
    │       │   └── route.ts               ← NEW: OAuth code exchange handler
    │       ├── login/
    │       │   └── page.tsx               ← NEW: Login page
    │       └── signup/
    │           └── page.tsx               ← NEW: Signup page
    └── components/
        └── auth/
            ├── SocialLoginButton.tsx      ← NEW: Google (active) + Instagram (disabled)
            ├── LoginForm.tsx              ← NEW: email + password form
            └── SignupForm.tsx             ← NEW: email + password + name + ABN form
```

---

## Supabase Dashboard Configuration

### Step 1 — Redirect URLs
Go to: **Authentication → URL Configuration**

| Setting | Value |
|---|---|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/callback` |
| Production (add later) | `https://your-domain.com/callback` |

### Step 2 — Google OAuth Provider
Go to: **Authentication → Providers → Google**

1. Toggle **Enable** on
2. Paste your **Google Client ID** and **Google Client Secret**
3. In [Google Cloud Console](https://console.cloud.google.com), add this to **Authorized redirect URIs**:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```

> **How to get Google credentials:** Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID → Web Application.

---

## Phase 1: Environment Setup

- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy project URL and anon key from **Settings → API**
- [ ] Create `.env.local` in `smart-invoice-frontend/`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```
- [ ] Add `.env.local` to `.gitignore` (already there — verify)
- [ ] Install packages:
  ```bash
  cd smart-invoice-frontend
  npm install @supabase/ssr @supabase/supabase-js
  ```

---

## Phase 2: Database Setup

- [ ] Open Supabase SQL Editor
- [ ] Run the full SQL block from above (profiles table + RLS + trigger)
- [ ] Verify table appears in **Table Editor → public → profiles**
- [ ] Verify trigger is listed in **Database → Functions → handle_new_user**

---

## Phase 3: Supabase Client Files

### `src/lib/supabase/client.ts` — Browser Client
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts` — Server Client
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## Phase 4: Middleware (Route Protection)

### `middleware.ts` (root of `smart-invoice-frontend/`)
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to /login (except auth routes)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/callback')

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Phase 5: Auth Route Group

### `src/app/(auth)/layout.tsx` — Sidebar-free layout
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  )
}
```

### `src/app/(auth)/callback/route.ts` — OAuth Code Exchange
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

---

## Phase 6: Auth Components

### `SocialLoginButton.tsx` — Google (active) + Instagram (disabled)
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function SocialLoginButton({
  provider,
  disabled = false,
}: {
  provider: 'google' | 'instagram'
  disabled?: boolean
}) {
  const supabase = createClient()

  const handleLogin = async () => {
    if (provider === 'google') {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/callback` },
      })
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition
        ${disabled
          ? 'opacity-40 cursor-not-allowed bg-muted border-border text-muted-foreground'
          : 'hover:bg-accent border-border'
        }`}
    >
      {provider === 'google' && <GoogleIcon />}
      {provider === 'instagram' && <InstagramIcon />}
      {provider === 'google' ? 'Continue with Google' : 'Instagram (Coming Soon)'}
    </button>
  )
}
```

### `SignupForm.tsx` — Fields: email, password, full name, business name, ABN
```tsx
'use client'
// Uses react-hook-form + zod for validation
// On submit: supabase.auth.signUp({ email, password, options: { data: { full_name } } })
// Then: supabase.from('profiles').upsert({ id: user.id, business_name, abn, full_name })
```

---

## Phase 7: Testing & Validation

- [ ] `npm run dev` — navigate to `http://localhost:3000` — should redirect to `/login`
- [ ] Login page renders correctly with no sidebar/nav
- [ ] Click **Continue with Google** — Google OAuth flow completes — lands on dashboard
- [ ] Navigate to `/signup` — fill in all fields — submit
- [ ] Check email for Supabase confirmation link — click it
- [ ] In Supabase → Table Editor → **profiles** — confirm new row with `business_name` and `abn`
- [ ] Log out and try to access `/invoices` directly — should redirect to `/login`
- [ ] Instagram button is visible but disabled with "Coming Soon" label

---

## Key Decisions & Notes

| Decision | Reason |
|---|---|
| `@supabase/ssr` over `auth-helpers-nextjs` | `auth-helpers-nextjs` is officially deprecated |
| Route group `(auth)` | Isolates auth pages from the main layout cleanly — no hacks |
| DB trigger for profile creation | Works for both OAuth and email signup without extra API calls |
| RLS on `profiles` | Users can only read/write their own profile — enforced at DB level |
| `instagram_username` column | Placeholder for future Instagram OAuth — no breaking migration needed later |
| Disabled Instagram button | Shows the feature is planned — builds trust with users |
