-- ----------------------------------------------------
-- Analytics Events Table & Indexes Schema
-- ----------------------------------------------------
-- Go to: https://supabase.com/dashboard/project/nywrftutioksevutcrpn/sql/new
-- Run this statement in the SQL Editor to set up the database table:

create table if not exists analytics_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null,
  event_name  text not null, -- 'page_view', 'add_to_cart', 'checkout_start', 'purchase'
  path        text not null,
  referrer    text,
  device      text,          -- 'mobile', 'desktop', 'tablet'
  browser     text,          -- 'Chrome', 'Safari', 'Firefox', etc.
  os          text,          -- 'iOS', 'Android', 'Windows', 'macOS', etc.
  country     text,          -- ISO Code (e.g. 'TR', 'SA')
  event_data  jsonb,         -- metadata (e.g. { product_slug: "...", total_price: 310 })
  created_at  timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table analytics_events enable row level security;

-- Drop existing policies if any
drop policy if exists "public insert events" on analytics_events;
drop policy if exists "service full events" on analytics_events;

-- Policies for inserting and accessing logs
create policy "public insert events" on analytics_events for insert with check (true);
create policy "service full events" on analytics_events for all using (auth.role() = 'service_role');

-- Speed up queries for dashboard statistics
create index if not exists idx_analytics_events_name_time on analytics_events(event_name, created_at);
create index if not exists idx_analytics_events_session on analytics_events(session_id);
create index if not exists idx_analytics_events_created_at on analytics_events(created_at);
