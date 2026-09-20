-- =====================================================================
-- Elite Squad Tracker — perbaikan pendaftaran
--
-- Masalah yang diperbaiki:
--   1. Trigger `handle_new_user` dijalankan di dalam transaksi yang sama
--      dengan INSERT ke auth.users. Kalau trigger itu gagal karena alasan
--      apa pun (tabel belum ada, constraint, hak akses), SELURUH pendaftaran
--      ikut gagal dengan "Database error saving new user". Pembuatan profil
--      seharusnya tidak pernah bisa memblokir pembuatan akun.
--   2. Kalau profil gagal dibuat, user punya akun tapi tanpa baris di
--      `profiles` — aplikasi butuh cara memperbaikinya sendiri.
--
-- Jalankan SETELAH 0001 dan 0002. Aman dijalankan berulang.
-- =====================================================================

-- ---------- Nama tampilan yang selalu lolos constraint profiles ----------
create or replace function public.derive_full_name(p_meta jsonb, p_email text)
returns text
language sql
immutable
as $$
  select left(
    coalesce(
      nullif(trim(p_meta ->> 'full_name'), ''),
      nullif(trim(p_meta ->> 'name'), ''),
      nullif(split_part(coalesce(p_email, ''), '@', 1), ''),
      'Peserta'
    ) || case
           -- constraint profiles menuntut minimal 2 karakter.
           when char_length(trim(coalesce(
             nullif(trim(p_meta ->> 'full_name'), ''),
             nullif(trim(p_meta ->> 'name'), ''),
             nullif(split_part(coalesce(p_email, ''), '@', 1), ''),
             'Peserta'
           ))) < 2 then ' Peserta'
           else ''
         end,
    120
  );
$$;

-- ---------- Trigger pendaftaran yang tidak bisa memblokir signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, full_name, squad, faculty, phone)
    values (
      new.id,
      public.derive_full_name(new.raw_user_meta_data, new.email),
      nullif(trim(new.raw_user_meta_data ->> 'squad'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'faculty'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
    )
    on conflict (id) do nothing;
  exception
    when others then
      -- Jangan pernah menggagalkan pendaftaran hanya karena profil gagal
      -- dibuat. Aplikasi akan membuatnya menyusul lewat ensure_profile().
      raise warning 'handle_new_user gagal untuk % : % (%)', new.id, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Jaring pengaman: aplikasi membuat profilnya sendiri ----------
-- Dipanggil aplikasi saat user sudah login tapi barisnya belum ada di
-- `profiles`. Tanpa ini, user tersebut terjebak loop redirect antara
-- /login dan /dashboard.
create or replace function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_user    auth.users%rowtype;
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Tidak ada sesi aktif' using errcode = '28000';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if found then
    return v_profile;
  end if;

  select * into v_user from auth.users where id = v_uid;
  if not found then
    raise exception 'User tidak ditemukan' using errcode = '28000';
  end if;

  insert into public.profiles (id, full_name, squad, faculty, phone)
  values (
    v_uid,
    public.derive_full_name(v_user.raw_user_meta_data, v_user.email),
    nullif(trim(v_user.raw_user_meta_data ->> 'squad'), ''),
    nullif(trim(v_user.raw_user_meta_data ->> 'faculty'), ''),
    nullif(trim(v_user.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;

  select * into v_profile from public.profiles where id = v_uid;
  return v_profile;
end;
$$;

revoke all on function public.ensure_profile() from public;
grant execute on function public.ensure_profile() to authenticated;

-- ---------- Perbaiki user lama yang terlanjur tanpa profil ----------
insert into public.profiles (id, full_name, squad, faculty, phone)
select
  u.id,
  public.derive_full_name(u.raw_user_meta_data, u.email),
  nullif(trim(u.raw_user_meta_data ->> 'squad'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'faculty'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'phone'), '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ---------- Pemeriksa kesiapan instalasi ----------
-- Dipakai halaman /setup-check untuk memastikan ketiga migrasi sudah jalan.
-- Sengaja hanya mengembalikan status ada/tidak ada, tanpa data apa pun.
create or replace function public.setup_status()
returns table (item text, ready boolean, detail text)
language sql
security definer
stable
set search_path = public
as $$
  select 'Tabel profiles', to_regclass('public.profiles') is not null, 'Migrasi 0001'
  union all
  select 'Tabel weekly_trackers', to_regclass('public.weekly_trackers') is not null, 'Migrasi 0001'
  union all
  select 'Tabel xp_events', to_regclass('public.xp_events') is not null, 'Migrasi 0002'
  union all
  select 'Tabel daily_amal_logs', to_regclass('public.daily_amal_logs') is not null, 'Migrasi 0002'
  union all
  select 'Data amalan yaumi',
         coalesce((select count(*) from public.amal_items), 0) > 0,
         coalesce((select count(*)::text from public.amal_items), '0') || ' item'
  union all
  select 'Data sesi modul',
         coalesce((select count(*) from public.module_sessions), 0) > 0,
         coalesce((select count(*)::text from public.module_sessions), '0') || ' sesi'
  union all
  select 'Data level',
         coalesce((select count(*) from public.levels), 0) > 0,
         coalesce((select count(*)::text from public.levels), '0') || ' level'
  union all
  select 'Trigger profil otomatis',
         exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal),
         'Migrasi 0003'
  union all
  select 'Fungsi ensure_profile',
         to_regprocedure('public.ensure_profile()') is not null,
         'Migrasi 0003';
$$;

revoke all on function public.setup_status() from public;
grant execute on function public.setup_status() to anon, authenticated;
