-- ============================================================
-- LevelUP — Migration v2: Data Sheet Parity
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Only needed if you already ran supabase-schema.sql before
-- ============================================================

-- Add nickname to ammo_lots
ALTER TABLE public.ammo_lots
  ADD COLUMN IF NOT EXISTS nickname text;

-- Add spread, elevation, wind, and per-round notes to shots
ALTER TABLE public.shots
  ADD COLUMN IF NOT EXISTS v_spread_in numeric(6,3),
  ADD COLUMN IF NOT EXISTS h_spread_in numeric(6,3),
  ADD COLUMN IF NOT EXISTS elevation numeric(6,2),
  ADD COLUMN IF NOT EXISTS elevation_unit text DEFAULT 'moa' CHECK (elevation_unit IN ('moa', 'mil')),
  ADD COLUMN IF NOT EXISTS wind_speed numeric(5,1),
  ADD COLUMN IF NOT EXISTS wind_direction text,
  ADD COLUMN IF NOT EXISTS round_notes text;
