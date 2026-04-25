-- Incremental Migration: Add User Management Fields to Profiles
-- Created at: 2026-04-25

alter table public.profiles 
  add column if not exists email text,
  add column if not exists username text,
  add column if not exists suspended_at timestamptz;

-- Refresh view or cache if necessary (handled by Supabase automatically)
