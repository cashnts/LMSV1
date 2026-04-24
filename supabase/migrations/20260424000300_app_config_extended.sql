alter table public.app_config 
  add column support_email text default '',
  add column brand_color text default '#4f46e5',
  add column custom_head_scripts text default '',
  add column stripe_public_key text default '',
  add column stripe_secret_key text default '',
  add column stripe_webhook_secret text default '';
