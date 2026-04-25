-- 3. Courses, Lessons, and Assets
-- Created at: 2026-04-25

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  instructor_id text not null references public.profiles (id) on delete cascade,
  title text not null,
  description text default '',
  published boolean default false not null,
  thumbnail_url text,
  outcomes text[] default '{}' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index courses_instructor_id_idx on public.courses (instructor_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  content_md text default '',
  sort_order int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index lessons_course_id_idx on public.lessons (course_id);

create table public.lesson_assets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  storage_bucket text not null default 'lesson-assets',
  object_path text not null,
  filename text not null,
  mime_type text,
  bytes bigint default 0,
  kind text not null check (kind in ('document', 'video')),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  storage_provider text not null default 'supabase' check (storage_provider in ('supabase', 'bunny-stream', 'bunny-storage', 'external')),
  bunny_video_id text,
  cdn_url text,
  created_at timestamptz default now() not null
);

create index lesson_assets_lesson_id_idx on public.lesson_assets (lesson_id);

-- Helper to check if user is the instructor of a course
create or replace function public.is_course_instructor(_course_id uuid, _user_id text)
returns boolean 
language sql 
security definer 
set search_path = public 
stable as $$
  select exists (select 1 from public.courses where id = _course_id and instructor_id = _user_id);
$$;

-- RLS Policies
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_assets enable row level security;

-- Courses
create policy "Courses select" on public.courses for select
  using (published or instructor_id = public.jwt_user_id() or public.get_my_role() = 'admin');

create policy "Courses insert" on public.courses for insert
  with check (public.get_my_role() in ('instructor', 'admin'));

create policy "Courses update" on public.courses for update
  using (instructor_id = public.jwt_user_id() or public.get_my_role() = 'admin');

create policy "Courses delete" on public.courses for delete
  using (instructor_id = public.jwt_user_id() or public.get_my_role() = 'admin');

-- Lessons
create policy "Lessons select" on public.lessons for select
  using (exists (select 1 from public.courses c where c.id = course_id));

create policy "Lessons all" on public.lessons for all
  using (exists (select 1 from public.courses c where c.id = course_id and (c.instructor_id = public.jwt_user_id() or public.get_my_role() = 'admin')));

-- Lesson Assets
create policy "Lesson assets select" on public.lesson_assets for select
  using (exists (select 1 from public.lessons l where l.id = lesson_id));

create policy "Lesson assets all" on public.lesson_assets for all
  using (exists (select 1 from public.lessons l join public.courses c on c.id = l.course_id 
  where l.id = lesson_id and (c.instructor_id = public.jwt_user_id() or public.get_my_role() = 'admin')));
