create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  course_id uuid not null references public.courses (id) on delete cascade,
  issued_at timestamptz default now() not null,
  unique (user_id, course_id)
);

create index certificates_user_id_idx on public.certificates (user_id);
create index certificates_course_id_idx on public.certificates (course_id);

alter table public.certificates enable row level security;

create policy cert_select on public.certificates
  for select using (
    user_id = public.jwt_user_id()
    or exists (
      select 1 from public.courses c
      where c.id = course_id
      and public.is_instructor_or_owner(public.jwt_user_id(), c.org_id)
    )
  );

create policy cert_insert on public.certificates
  for insert with check (user_id = public.jwt_user_id());
