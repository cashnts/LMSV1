-- LMS core schema
create extension if not exists "uuid-ossp";

-- Organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_customer_id text,
  subscription_status text default 'inactive',
  created_at timestamptz default now() not null
);

create table public.organization_members (
  user_id text not null,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('owner', 'instructor', 'learner')),
  created_at timestamptz default now() not null,
  primary key (user_id, org_id)
);

create index organization_members_org_id_idx on public.organization_members (org_id);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text default '',
  published boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index courses_org_id_idx on public.courses (org_id);

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
  created_at timestamptz default now() not null
);

create index lesson_assets_lesson_id_idx on public.lesson_assets (lesson_id);

create table public.enrollments (
  user_id text not null,
  course_id uuid not null references public.courses (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  enrolled_at timestamptz default now() not null,
  stripe_checkout_session_id text,
  primary key (user_id, course_id)
);

create index enrollments_user_id_idx on public.enrollments (user_id);

create table public.lesson_progress (
  user_id text not null,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz,
  last_seconds int,
  updated_at timestamptz default now() not null,
  primary key (user_id, lesson_id)
);

-- Helper: is member of org
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
      (
        nullif(current_setting('request.jwt.claims', true), '')
      )::jsonb ->> 'sub',
      ''
    ),
    nullif(
      (
        nullif(current_setting('request.jwt.claims', true), '')
      )::jsonb ->> 'user_id',
      ''
    )
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

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_assets enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- organizations: members can read their orgs
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

-- organization_members
create policy om_select on public.organization_members
  for select using (user_id = public.jwt_user_id() or public.is_org_member(public.jwt_user_id(), org_id));

create policy om_insert_owner on public.organization_members
  for insert with check (user_id = public.jwt_user_id() and role = 'owner');

create policy om_insert_by_staff on public.organization_members
  for insert with check (public.is_instructor_or_owner(public.jwt_user_id(), org_id));

-- courses: read if member of org and (published or instructor)
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

-- lessons: visible with course access
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

-- lesson_assets
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

-- enrollments
create policy en_select on public.enrollments
  for select using (user_id = public.jwt_user_id() or public.is_instructor_or_owner(public.jwt_user_id(), org_id));

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
  for delete using (user_id = public.jwt_user_id() or public.is_instructor_or_owner(public.jwt_user_id(), org_id));

-- lesson_progress
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

-- Storage bucket (run in dashboard or via SQL)
insert into storage.buckets (id, name, public)
values ('lesson-assets', 'lesson-assets', false)
on conflict (id) do nothing;

-- Storage policies: path = {org_id}/{lesson_id}/{filename}
-- Path format: {org_id}/{lesson_id}/{filename}
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
