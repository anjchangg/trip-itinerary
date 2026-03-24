-- Run this in your Supabase project → SQL Editor

-- Table 1: stores the current trip state
create table if not exists trips (
  trip_id text primary key,
  snapshot jsonb not null,
  editor text,
  updated_at timestamptz default now()
);

-- Table 2: stores history of every save
create table if not exists trip_history (
  id bigserial primary key,
  trip_id text not null,
  snapshot jsonb not null,
  editor text,
  label text,
  created_at timestamptz default now()
);

-- Allow anyone to read and write (no login required)
alter table trips enable row level security;
alter table trip_history enable row level security;

create policy "public read trips" on trips for select using (true);
create policy "public write trips" on trips for all using (true) with check (true);

create policy "public read history" on trip_history for select using (true);
create policy "public write history" on trip_history for insert with check (true);

-- Enable real-time updates
alter publication supabase_realtime add table trips;
