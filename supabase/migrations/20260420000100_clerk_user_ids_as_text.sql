-- Clerk user ids are strings like "user_..." and do not match auth.users UUIDs.
-- Store them as text and read them from the JWT directly so RLS works.

drop policy if exists org_select on public.organizations;
drop policy if exists org_insert on public.organizations;
drop policy if exists org_update on public.organizations;
drop policy if exists om_select on public.organization_members;
drop policy if exists om_insert_owner on public.organization_members;
drop policy if exists om_insert_by_staff on public.organization_members;
drop policy if exists courses_select on public.courses;
drop policy if exists courses_write on public.courses;
drop policy if exists courses_update on public.courses;
drop policy if exists courses_delete on public.courses;
drop policy if exists lessons_select on public.lessons;
drop policy if exists lessons_write on public.lessons;
drop policy if exists lessons_update on public.lessons;
drop policy if exists lessons_delete on public.lessons;
drop policy if exists la_select on public.lesson_assets;
drop policy if exists la_insert on public.lesson_assets;
drop policy if exists la_update on public.lesson_assets;
drop policy if exists la_delete on public.lesson_assets;
drop policy if exists en_select on public.enrollments;
drop policy if exists en_insert on public.enrollments;
drop policy if exists en_delete on public.enrollments;
drop policy if exists lp_select on public.lesson_progress;
drop policy if exists lp_upsert on public.lesson_progress;
drop policy if exists lp_update on public.lesson_progress;
drop policy if exists lesson_assets_read on storage.objects;
drop policy if exists lesson_assets_upload on storage.objects;
drop policy if exists lesson_assets_update on storage.objects;
drop policy if exists lesson_assets_delete on storage.objects;

alter table public.organization_members
  drop constraint if exists organization_members_user_id_fkey;

alter table public.enrollments
  drop constraint if exists enrollments_user_id_fkey;

alter table public.lesson_progress
  drop constraint if exists lesson_progress_user_id_fkey;

alter table public.organization_members
  alter column user_id type text using user_id::text;

alter table public.enrollments
  alter column user_id type text using user_id::text;

alter table public.lesson_progress
  alter column user_id type text using user_id::text;

create or replace function public.jwt_user_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'sub', ''),
    nullif(auth.jwt() ->> 'user_id', '')
  );
$$;

create or replace function public.is_org_member(_uid text, _org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.user_id = _uid and m.org_id = _org
  );
$$;

create or replace function public.is_instructor_or_owner(_uid text, _org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.user_id = _uid and m.org_id = _org
    and m.role in ('owner', 'instructor')
  );
$$;

create policy org_select on public.organizations
  for select using (
    public.is_org_member(public.jwt_user_id(), id)
  );

create policy org_insert on public.organizations
  for insert with check (public.jwt_user_id() is not null);

create policy org_update on public.organizations
  for update using (
    public.is_instructor_or_owner(public.jwt_user_id(), id)
  );

create policy om_select on public.organization_members
  for select using (
    user_id = public.jwt_user_id()
    or public.is_org_member(public.jwt_user_id(), org_id)
  );

create policy om_insert_owner on public.organization_members
  for insert with check (user_id = public.jwt_user_id() and role = 'owner');

create policy om_insert_by_staff on public.organization_members
  for insert with check (public.is_instructor_or_owner(public.jwt_user_id(), org_id));

create policy courses_select on public.courses
  for select using (
    public.is_org_member(public.jwt_user_id(), org_id)
    and (
      published
      or public.is_instructor_or_owner(public.jwt_user_id(), org_id)
      or exists (
        select 1 from public.enrollments e
        where e.course_id = courses.id and e.user_id = public.jwt_user_id()
      )
    )
  );

create policy courses_write on public.courses
  for insert with check (public.is_instructor_or_owner(public.jwt_user_id(), org_id));

create policy courses_update on public.courses
  for update using (public.is_instructor_or_owner(public.jwt_user_id(), org_id));

create policy courses_delete on public.courses
  for delete using (public.is_instructor_or_owner(public.jwt_user_id(), org_id));

create policy lessons_select on public.lessons
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
      and public.is_org_member(public.jwt_user_id(), c.org_id)
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

create policy lessons_write on public.lessons
  for insert with check (
    exists (
      select 1 from public.courses c
      where c.id = course_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );

create policy lessons_update on public.lessons
  for update using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );

create policy lessons_delete on public.lessons
  for delete using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );

create policy la_select on public.lesson_assets
  for select using (
    exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_assets.lesson_id
      and public.is_org_member(public.jwt_user_id(), c.org_id)
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

create policy la_insert on public.lesson_assets
  for insert with check (
    exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_assets.lesson_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );

create policy la_update on public.lesson_assets
  for update using (
    exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_assets.lesson_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );

create policy la_delete on public.lesson_assets
  for delete using (
    exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_assets.lesson_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );

create policy en_select on public.enrollments
  for select using (
    user_id = public.jwt_user_id()
    or public.is_instructor_or_owner(public.jwt_user_id(), org_id)
  );

create policy en_insert on public.enrollments
  for insert with check (
    user_id = public.jwt_user_id()
    and public.is_org_member(public.jwt_user_id(), org_id)
    and exists (
      select 1 from public.courses c
      where c.id = course_id and c.org_id = enrollments.org_id
      and c.published = true
    )
  );

create policy en_delete on public.enrollments
  for delete using (
    user_id = public.jwt_user_id()
    or public.is_instructor_or_owner(public.jwt_user_id(), org_id)
  );

create policy lp_select on public.lesson_progress
  for select using (
    user_id = public.jwt_user_id()
    or exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_progress.lesson_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );

create policy lp_upsert on public.lesson_progress
  for insert with check (user_id = public.jwt_user_id());

create policy lp_update on public.lesson_progress
  for update using (user_id = public.jwt_user_id());

create policy lesson_assets_read on storage.objects
  for select using (
    bucket_id = 'lesson-assets'
    and exists (
      select 1 from public.courses c
      join public.lessons l on l.course_id = c.id
      where c.org_id::text = split_part(name, '/', 1)
      and l.id::text = split_part(name, '/', 2)
      and public.is_org_member(public.jwt_user_id(), c.org_id)
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

create policy lesson_assets_upload on storage.objects
  for insert with check (
    bucket_id = 'lesson-assets'
    and public.is_instructor_or_owner(
      public.jwt_user_id(),
      split_part(name, '/', 1)::uuid
    )
  );

create policy lesson_assets_update on storage.objects
  for update using (
    bucket_id = 'lesson-assets'
    and public.is_instructor_or_owner(
      public.jwt_user_id(),
      split_part(name, '/', 1)::uuid
    )
  );

create policy lesson_assets_delete on storage.objects
  for delete using (
    bucket_id = 'lesson-assets'
    and public.is_instructor_or_owner(
      public.jwt_user_id(),
      split_part(name, '/', 1)::uuid
    )
  );
