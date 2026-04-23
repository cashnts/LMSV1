drop policy if exists comments_select on public.lesson_comments;
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

drop policy if exists comments_insert on public.lesson_comments;
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
