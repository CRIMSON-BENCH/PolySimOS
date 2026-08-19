-- Saved solver setups ("scenarios") for signed-in users (/api/scenarios).
-- A scenario is just the current solver URL (slug + tuned query params) tied to the
-- user's email. Optional: the API succeeds even if this table doesn't exist yet, so
-- create it here (Supabase ▸ SQL Editor) to turn on saving.
create table if not exists public.scenarios (
  id         bigint generated always as identity primary key,
  email      text not null,
  slug       text not null,
  name       text not null,
  path       text not null,   -- e.g. /studio/double-pendulum?g=9.8&m=10
  created_at timestamptz not null default now()
);

-- RLS on, no policies → only the service role (our server /api/scenarios) can read/write.
alter table public.scenarios enable row level security;

create index if not exists scenarios_email_idx on public.scenarios (email, created_at desc);
