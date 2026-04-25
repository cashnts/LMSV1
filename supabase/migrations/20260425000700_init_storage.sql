-- 7. Storage Buckets and Policies
-- Created at: 2026-04-25

-- Setup bucket
insert into storage.buckets (id, name, public)
values ('lesson-assets', 'lesson-assets', false)
on conflict (id) do nothing;

-- Storage Policies
create policy "Lesson assets read" on storage.objects for select using (bucket_id = 'lesson-assets');
create policy "Lesson assets write" on storage.objects for all using (bucket_id = 'lesson-assets' and public.get_my_role() in ('admin', 'instructor'));
