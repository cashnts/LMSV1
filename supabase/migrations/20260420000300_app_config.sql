create table if not exists public.app_config (
  id boolean primary key default true check (id = true),
  organization_creation_mode text not null default 'app_admin' check (organization_creation_mode in ('app_admin', 'authenticated')),
  course_creation_mode text not null default 'app_admin' check (course_creation_mode in ('app_admin', 'org_staff')),
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

insert into public.app_config (id, organization_creation_mode, course_creation_mode)
values (true, 'app_admin', 'app_admin')
on conflict (id) do nothing;
