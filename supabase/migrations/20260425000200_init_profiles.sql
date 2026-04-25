-- 2. Profiles and Role Management
-- Created at: 2026-04-25

create table public.profiles (
  id text primary key, 
  role text not null check (role in ('admin', 'instructor', 'student')) default 'student',
  full_name text,
  avatar_url text,
  updated_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles select" on public.profiles for select using (true);
create policy "Profiles update" on public.profiles for update using (id = public.jwt_user_id());

-- Helper to get current user role
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = public.jwt_user_id();
$$;
