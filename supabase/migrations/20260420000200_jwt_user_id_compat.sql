create or replace function public.jwt_user_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'sub', ''),
    nullif(auth.jwt() ->> 'user_id', ''),
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claim.user_id', true), ''),
    nullif(
      (
        nullif(current_setting('request.jwt.claims', true), '')
      )::jsonb ->> 'sub',
      ''
    ),
    nullif(
      (
        nullif(current_setting('request.jwt.claims', true), '')
      )::jsonb ->> 'user_id',
      ''
    )
  );
$$;
