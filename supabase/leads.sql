-- Email leads captured by the value-moment "save your work" prompt (/api/lead).
-- Optional: the capture endpoint succeeds even if this table doesn't exist yet;
-- create it (Supabase ▸ SQL Editor) to actually persist leads.
create table if not exists public.leads (
  id         bigint generated always as identity primary key,
  email      text not null,
  source     text,
  created_at timestamptz not null default now()
);

-- RLS on, no policies → only the service role (our server /api/lead) can read/write.
alter table public.leads enable row level security;

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_created_idx on public.leads (created_at);
