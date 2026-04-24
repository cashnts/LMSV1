alter table public.app_config 
  add column bunny_storage_zone text default '',
  add column bunny_storage_access_key text default '',
  add column bunny_storage_cdn_url text default '',
  add column bunny_storage_region text default 'ny';