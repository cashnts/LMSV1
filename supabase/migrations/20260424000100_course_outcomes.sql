-- Add outcomes column to courses table
alter table public.courses add column outcomes text[] default '{}' not null;
