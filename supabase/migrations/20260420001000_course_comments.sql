create table public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  user_id text not null,
  content text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index lesson_comments_lesson_id_idx on public.lesson_comments (lesson_id);

alter table public.lesson_comments enable row level security;

create policy comments_select on public.lesson_comments
  for select using (
    exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_comments.lesson_id
      and (
        c.published
        or public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
        or exists (
          select 1 from public.enrollments e
          where e.course_id = c.id and e.user_id = public.jwt_user_id()
        )
      )
    )
  );

create policy comments_insert on public.lesson_comments
  for insert with check (
    user_id = public.jwt_user_id()
    and exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_id
      and (
        public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
        or exists (
          select 1 from public.enrollments e
          where e.course_id = c.id and e.user_id = public.jwt_user_id()
        )
      )
    )
  );

create policy comments_delete on public.lesson_comments
  for delete using (
    user_id = public.jwt_user_id()
    or exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );
