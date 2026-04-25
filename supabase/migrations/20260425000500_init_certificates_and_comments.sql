-- 5. Certificates and Comments
-- Created at: 2026-04-25

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  issued_at timestamptz default now() not null,
  certificate_path text,
  unique (user_id, course_id)
);

create table public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  author_id text not null references public.profiles (id) on delete cascade,
  author_name text,
  content text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS Policies
alter table public.certificates enable row level security;
alter table public.lesson_comments enable row level security;

-- Certificates
create policy "Certificates select" on public.certificates for select 
  using (user_id = public.jwt_user_id() or public.get_my_role() = 'admin' or public.is_course_instructor(course_id, public.jwt_user_id()));

-- Comments
create policy "Comments select" on public.lesson_comments for select using (true);
create policy "Comments insert" on public.lesson_comments for insert with check (public.jwt_user_id() is not null);
create policy "Comments delete" on public.lesson_comments for delete 
  using (author_id = public.jwt_user_id() or public.get_my_role() = 'admin');
