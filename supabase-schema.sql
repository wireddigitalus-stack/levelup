-- ============================================================
-- LevelUP — Supabase Database Schema
-- Rimfire Lot Testing & Ballistic Analytics Platform
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES — Shooter identity & preferences
-- ============================================================
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null default 'Shooter',
  email text,
  avatar_url text,
  -- Preferences
  units text not null default 'imperial' check (units in ('imperial', 'metric')),
  default_zero_range int not null default 50,
  target_size_inches numeric(4,2) not null default 1.0,
  drop_unit text not null default 'moa' check (drop_unit in ('moa', 'mil')),
  temp_unit text not null default 'F' check (temp_unit in ('F', 'C')),
  notifications_enabled boolean not null default true,
  haptic_enabled boolean not null default true,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. RIFLES — Rifle configurations
-- ============================================================
create table public.rifles (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  caliber text not null default '.22 LR',
  barrel_length text,
  barrel_manufacturer text,
  twist_rate text,
  scope text,
  tuner_type text default 'None',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. AMMO_LOTS — Ammunition inventory with lot tracking
-- ============================================================
create table public.ammo_lots (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  brand text not null,
  model text not null,
  lot_number text not null,
  nickname text,
  caliber text not null default '.22 LR',
  bullet_weight_gr numeric(5,1) not null default 40.0,
  purchase_price numeric(8,2),
  quantity_remaining int default 0,
  quantity_purchased int default 0,
  purchase_date date,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. SESSIONS — Range day records with conditions
-- ============================================================
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  location text not null,
  temperature numeric(5,1),
  humidity numeric(5,1),
  density_altitude int,
  wind_speed numeric(5,1),
  wind_direction text,
  barometric_pressure numeric(6,2),
  elevation_ft int,
  condition text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. SHOTS — Individual shot logs (the core data)
-- ============================================================
create table public.shots (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  rifle_id uuid not null references public.rifles(id) on delete cascade,
  ammo_lot_id uuid not null references public.ammo_lots(id) on delete cascade,
  -- Shot data
  velocity_fps numeric(7,1) not null,
  group_size_moa numeric(6,3),
  poi_vertical numeric(6,2),
  poi_horizontal numeric(6,2),
  is_cold_bore boolean not null default false,
  tuner_setting numeric(6,2),
  shot_number int,
  -- Computed per-group (filled after group complete)
  group_sd numeric(6,2),
  group_es numeric(6,2),
  -- Media
  target_photo_url text,
  -- Timestamps
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. SCANNED_SHEETS — OCR scan results from data sheets
-- ============================================================
create table public.scanned_sheets (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  -- Original image
  image_url text,
  -- Extracted data (JSON blob from Gemini Vision)
  extracted_data jsonb not null default '{}',
  confidence text check (confidence in ('high', 'medium', 'low')),
  warnings text[],
  -- Import status
  is_imported boolean not null default false,
  imported_at timestamptz,
  -- Timestamps
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7. SPOTTER_CONVERSATIONS — AI chat history
-- ============================================================
create table public.spotter_conversations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  page_context text,
  user_message text not null,
  spotter_response text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES — Performance optimization
-- ============================================================
create index idx_shots_session on public.shots(session_id);
create index idx_shots_rifle on public.shots(rifle_id);
create index idx_shots_ammo on public.shots(ammo_lot_id);
create index idx_shots_profile on public.shots(profile_id);
create index idx_shots_created on public.shots(created_at desc);
create index idx_sessions_profile on public.sessions(profile_id);
create index idx_sessions_date on public.sessions(date desc);
create index idx_ammo_lots_profile on public.ammo_lots(profile_id);
create index idx_rifles_profile on public.rifles(profile_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Users only see their own data
-- ============================================================
alter table public.profiles enable row level security;
alter table public.rifles enable row level security;
alter table public.ammo_lots enable row level security;
alter table public.sessions enable row level security;
alter table public.shots enable row level security;
alter table public.scanned_sheets enable row level security;
alter table public.spotter_conversations enable row level security;

-- Profiles: users can read/write their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);

-- All other tables: users can CRUD their own data via profile_id
-- (We match profile_id to the user's profile)
create policy "Own data only" on public.rifles for all using (
  profile_id in (select id from public.profiles where user_id = auth.uid())
);
create policy "Own data only" on public.ammo_lots for all using (
  profile_id in (select id from public.profiles where user_id = auth.uid())
);
create policy "Own data only" on public.sessions for all using (
  profile_id in (select id from public.profiles where user_id = auth.uid())
);
create policy "Own data only" on public.shots for all using (
  profile_id in (select id from public.profiles where user_id = auth.uid())
);
create policy "Own data only" on public.scanned_sheets for all using (
  profile_id in (select id from public.profiles where user_id = auth.uid())
);
create policy "Own data only" on public.spotter_conversations for all using (
  profile_id in (select id from public.profiles where user_id = auth.uid())
);

-- ============================================================
-- FUNCTIONS — Auto-update timestamps
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.rifles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.ammo_lots
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.sessions
  for each row execute function public.handle_updated_at();
