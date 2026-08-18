-- Entitlements table: the account-level record of what a user has paid for.
-- Written by src/app/api/stripe-webhook/route.ts (service-role key — bypasses RLS).
-- Read by src/app/api/entitlements/route.ts (also service-role, scoped to the
-- signed-in user's email server-side) so a paid plan follows the user across
-- devices instead of being stuck to whichever browser completed checkout.
--
-- Run this once in the Supabase SQL editor for your project.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  email text,
  stripe_customer text,
  grant_key text not null,
  status text not null default 'active',
  updated_at timestamptz not null default now(),
  unique (email, grant_key)
);

create index if not exists entitlements_email_idx on public.entitlements (email);
create index if not exists entitlements_customer_idx on public.entitlements (stripe_customer);

-- Row Level Security: locked down by default. All reads/writes go through the
-- Next.js API routes using the service-role key, which bypasses RLS entirely —
-- so no client-side policy is needed (and none should be added, since this table
-- holds billing state that a user should never write to directly).
alter table public.entitlements enable row level security;
