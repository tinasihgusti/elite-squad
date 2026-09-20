-- Stub minimal meniru lingkungan Supabase untuk keperluan uji migrasi.
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create table if not exists public._test_ctx (uid uuid);
create or replace function auth.uid() returns uuid language sql stable as $$
  select uid from public._test_ctx limit 1;
$$;
create role authenticated;
