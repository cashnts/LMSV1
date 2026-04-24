alter table public.app_config 
  add column if not exists bunny_stream_library_id text default '';
