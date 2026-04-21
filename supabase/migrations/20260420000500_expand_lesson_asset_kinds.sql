alter table public.lesson_assets
  drop constraint if exists lesson_assets_kind_check;

alter table public.lesson_assets
  add constraint lesson_assets_kind_check
  check (kind in ('document', 'file', 'image', 'video'));
