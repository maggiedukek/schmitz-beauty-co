-- Brenna's Dashboard — Phase 1 schema (Leads)
-- Run this in Supabase → SQL Editor once the project exists.
-- It creates the leads table, turns on Row Level Security, and sets safe access:
--   • the PUBLIC website can INSERT a new consultation request (but cannot read anything)
--   • only a LOGGED-IN Brenna can read, update, or delete leads

-- 1) The table -------------------------------------------------------------
create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),

  -- submitted by the public consultation form
  full_name           text,
  email               text,
  phone               text,
  interested_service  text,
  current_hair_state  text,
  beauty_goals        text,
  inspiration_photos  text,
  preferred_days      text,
  additional_notes    text,

  -- managed by Brenna inside the dashboard
  status              text not null default 'new'
                        check (status in ('new','contacted','booked','closed')),
  internal_notes      text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status);

-- 2) Row Level Security ----------------------------------------------------
alter table public.leads enable row level security;

-- Public (anonymous) visitors may ONLY create a lead — never read others.
drop policy if exists "public can submit a lead" on public.leads;
create policy "public can submit a lead"
  on public.leads
  for insert
  to anon
  with check (true);

-- Logged-in Brenna can read everything.
drop policy if exists "owner can read leads" on public.leads;
create policy "owner can read leads"
  on public.leads
  for select
  to authenticated
  using (true);

-- Logged-in Brenna can update status / notes.
drop policy if exists "owner can update leads" on public.leads;
create policy "owner can update leads"
  on public.leads
  for update
  to authenticated
  using (true)
  with check (true);

-- Logged-in Brenna can delete a lead.
drop policy if exists "owner can delete leads" on public.leads;
create policy "owner can delete leads"
  on public.leads
  for delete
  to authenticated
  using (true);

-- Done. Phases 2 (receipts/expenses) and 3 (supplies inventory) get their own
-- schema files when we build them.
