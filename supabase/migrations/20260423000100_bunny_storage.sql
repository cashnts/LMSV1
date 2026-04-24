-- Update Bunny.net storage fields to lesson_assets and allow 'external' provider
alter table public.lesson_assets
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists bunny_video_id text,
  add column if not exists cdn_url text;

alter table public.lesson_assets
  drop constraint if exists lesson_assets_storage_provider_check;

alter table public.lesson_assets
  add constraint lesson_assets_storage_provider_check
  check (storage_provider in ('supabase', 'bunny-stream', 'bunny-storage', 'external'));
