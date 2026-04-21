drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select using (
    published
    or public.is_instructor_or_owner(public.jwt_user_id(), org_id)
    or exists (
      select 1 from public.enrollments e
      where e.course_id = courses.id and e.user_id = public.jwt_user_id()
    )
  );

drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
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

drop policy if exists la_select on public.lesson_assets;
create policy la_select on public.lesson_assets
  for select using (
    exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_assets.lesson_id
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

drop policy if exists en_insert on public.enrollments;
create policy en_insert on public.enrollments
  for insert with check (
    user_id = public.jwt_user_id()
    and exists (
      select 1 from public.courses c
      where c.id = course_id
      and c.org_id = enrollments.org_id
      and c.published = true
    )
  );

drop policy if exists lesson_assets_read on storage.objects;
create policy lesson_assets_read on storage.objects
  for select using (
    bucket_id = 'lesson-assets'
    and exists (
      select 1 from public.courses c
      join public.lessons l on l.course_id = c.id
      where c.org_id::text = split_part(name, '/', 1)
      and l.id::text = split_part(name, '/', 2)
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
