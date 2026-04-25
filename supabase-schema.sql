-- ============================================================
-- LevelUP AI — Supabase Schema (ADDITIVE ONLY)
-- Only creates tables that don't already exist.
-- Safe to run alongside your existing rimfire lot testing schema.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- 1. USER PROFILES (skip if exists)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(auth_id)
);

-- ──────────────────────────────────────────────────────────────
-- 2. RIFLES (skip if exists)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.rifles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  make text not null,
  model text not null,
  barrel_length text,
  barrel_twist text,
  tuner_type text default 'None',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 3. AMMO LOTS (skip if exists)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.ammo_lots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  brand text not null,
  model text not null,
  lot_number text not null,
  nickname text,
  purchase_date date,
  quantity_remaining integer default 0,
  quantity_purchased integer default 0,
  cost_per_box numeric(8,2) default 0,
  boxes_purchased integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 4. SESSIONS (skip if exists)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  date date not null default current_date,
  location text,
  density_altitude integer,
  temperature numeric(5,1),
  humidity numeric(5,1),
  wind_speed numeric(5,1),
  wind_direction text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 5. SHOT LOGS (skip if exists)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.shot_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete cascade not null,
  rifle_id uuid references public.rifles(id) on delete set null,
  ammo_id uuid references public.ammo_lots(id) on delete set null,
  is_cold_bore boolean default false,
  tuner_setting numeric(6,1) default 0,
  velocity_fps numeric(7,1) not null,
  group_size_moa numeric(6,3),
  poi_vertical numeric(6,2) default 0,
  poi_horizontal numeric(6,2) default 0,
  v_spread_in numeric(6,3),
  h_spread_in numeric(6,3),
  elevation numeric(6,2),
  elevation_unit text check (elevation_unit in ('moa', 'mil')),
  wind_speed numeric(5,1),
  wind_direction text,
  round_notes text,
  photo_url text,
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 6. APP SETTINGS (skip if exists)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  units text default 'imperial' check (units in ('imperial', 'metric')),
  drop_unit text default 'moa' check (drop_unit in ('moa', 'mil')),
  temp_unit text default 'F' check (temp_unit in ('F', 'C')),
  default_zero integer default 50,
  target_size numeric(4,2) default 1.0,
  home_range text,
  elevation text,
  default_da text,
  auto_weather boolean default true,
  dark_mode boolean default true,
  compact_cards boolean default false,
  show_cost_data boolean default true,
  notifications boolean default true,
  haptic_feedback boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id)
);

-- ──────────────────────────────────────────────────────────────
-- INDEXES (safe — will skip if they already exist)
-- ──────────────────────────────────────────────────────────────
create index if not exists idx_rifles_user on public.rifles(user_id);
create index if not exists idx_ammo_user on public.ammo_lots(user_id);
create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_sessions_date on public.sessions(date desc);
create index if not exists idx_shots_session on public.shot_logs(session_id);
create index if not exists idx_shots_user on public.shot_logs(user_id);
create index if not exists idx_shots_ammo on public.shot_logs(ammo_id);
create index if not exists idx_shots_rifle on public.shot_logs(rifle_id);
create index if not exists idx_shots_timestamp on public.shot_logs(timestamp desc);

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (safe to re-run)
-- ──────────────────────────────────────────────────────────────
alter table public.user_profiles enable row level security;
alter table public.rifles enable row level security;
alter table public.ammo_lots enable row level security;
alter table public.sessions enable row level security;
alter table public.shot_logs enable row level security;
alter table public.app_settings enable row level security;

-- Policies — drop if exist, then recreate
do $$ begin
  drop policy if exists "Users manage own profile" on public.user_profiles;
  drop policy if exists "Users manage own rifles" on public.rifles;
  drop policy if exists "Users manage own ammo" on public.ammo_lots;
  drop policy if exists "Users manage own sessions" on public.sessions;
  drop policy if exists "Users manage own shots" on public.shot_logs;
  drop policy if exists "Users manage own settings" on public.app_settings;
end $$;

create policy "Users manage own profile"
  on public.user_profiles for all
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

create policy "Users manage own rifles"
  on public.rifles for all
  using (user_id = (select id from public.user_profiles where auth_id = auth.uid()))
  with check (user_id = (select id from public.user_profiles where auth_id = auth.uid()));

create policy "Users manage own ammo"
  on public.ammo_lots for all
  using (user_id = (select id from public.user_profiles where auth_id = auth.uid()))
  with check (user_id = (select id from public.user_profiles where auth_id = auth.uid()));

create policy "Users manage own sessions"
  on public.sessions for all
  using (user_id = (select id from public.user_profiles where auth_id = auth.uid()))
  with check (user_id = (select id from public.user_profiles where auth_id = auth.uid()));

create policy "Users manage own shots"
  on public.shot_logs for all
  using (user_id = (select id from public.user_profiles where auth_id = auth.uid()))
  with check (user_id = (select id from public.user_profiles where auth_id = auth.uid()));

create policy "Users manage own settings"
  on public.app_settings for all
  using (user_id = (select id from public.user_profiles where auth_id = auth.uid()))
  with check (user_id = (select id from public.user_profiles where auth_id = auth.uid()));

-- ──────────────────────────────────────────────────────────────
-- AUTO-UPDATE TIMESTAMPS
-- ──────────────────────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop triggers if they exist, then recreate
drop trigger if exists trg_user_profiles_updated on public.user_profiles;
drop trigger if exists trg_rifles_updated on public.rifles;
drop trigger if exists trg_ammo_lots_updated on public.ammo_lots;
drop trigger if exists trg_sessions_updated on public.sessions;
drop trigger if exists trg_app_settings_updated on public.app_settings;

create trigger trg_user_profiles_updated before update on public.user_profiles
  for each row execute function public.update_updated_at();

create trigger trg_rifles_updated before update on public.rifles
  for each row execute function public.update_updated_at();

create trigger trg_ammo_lots_updated before update on public.ammo_lots
  for each row execute function public.update_updated_at();

create trigger trg_sessions_updated before update on public.sessions
  for each row execute function public.update_updated_at();

create trigger trg_app_settings_updated before update on public.app_settings
  for each row execute function public.update_updated_at();
