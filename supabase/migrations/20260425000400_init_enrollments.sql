-- 4. Enrollments and Progress
-- Created at: 2026-04-25

create table public.enrollments (
  user_id text not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  enrolled_at timestamptz default now() not null,
  stripe_checkout_session_id text,
  primary key (user_id, course_id)
);

create table public.lesson_progress (
  user_id text not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz,
  last_seconds int,
  updated_at timestamptz default now() not null,
  primary key (user_id, lesson_id)
);

-- RLS Policies
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- Enrollments
create policy "Enrollments select" on public.enrollments for select
  using (user_id = public.jwt_user_id() or public.get_my_role() = 'admin' or public.is_course_instructor(course_id, public.jwt_user_id()));

create policy "Enrollments insert" on public.enrollments for insert
  with check (user_id = public.jwt_user_id() and exists (select 1 from public.courses where id = course_id and published = true));

-- Lesson Progress
create policy "Lesson progress select" on public.lesson_progress for select
  using (user_id = public.jwt_user_id() or public.get_my_role() = 'admin' or exists (select 1 from public.lessons l where l.id = lesson_id and public.is_course_instructor(l.course_id, public.jwt_user_id())));

create policy "Lesson progress all" on public.lesson_progress for all
  using (user_id = public.jwt_user_id());
