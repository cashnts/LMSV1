-- 1. Initial Cleanup and Auth Helpers
-- Created at: 2026-04-25

drop table if exists public.lesson_progress cascade;
drop table if exists public.lesson_assets cascade;
drop table if exists public.lessons cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.certificates cascade;
drop table if exists public.lesson_comments cascade;
drop table if exists public.courses cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.profiles cascade;
drop table if exists public.app_admin_members cascade;
drop table if exists public.app_config cascade;

drop function if exists public.jwt_user_id() cascade;
drop function if exists public.get_my_role() cascade;
drop function if exists public.is_enrolled(uuid, text) cascade;
drop function if exists public.is_course_instructor(uuid, text) cascade;

-- Helper to extract user ID from JWT (Clerk compatible)
create or replace function public.jwt_user_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'sub', ''),
    nullif(auth.jwt() ->> 'user_id', ''),
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claim.user_id', true), ''),
    nullif(
      (nullif(current_setting('request.jwt.claims', true), ''))::jsonb ->> 'sub',
      ''
    ),
    nullif(
      (nullif(current_setting('request.jwt.claims', true), ''))::jsonb ->> 'user_id',
      ''
    )
  );
$$;
