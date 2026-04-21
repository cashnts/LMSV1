alter table public.courses
  add column if not exists thumbnail_url text;
