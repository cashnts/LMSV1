alter table public.app_config add column app_name text not null default 'LMS';

create policy "Public read app_config" on public.app_config for select using (true);
