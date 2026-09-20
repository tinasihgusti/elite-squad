-- =====================================================================
-- CEK CEPAT: apa saja yang sudah terpasang di database ini?
--
-- Tempel seluruh isi file ini ke Supabase → SQL Editor → Run.
-- Aman dijalankan kapan saja: hanya membaca, tidak mengubah apa pun,
-- dan tetap jalan walau databasenya masih benar-benar kosong.
-- =====================================================================

select
  item,
  case when ready then '✅ SIAP' else '❌ BELUM' end as status,
  keterangan
from (
  values
    ('Tabel profiles',          to_regclass('public.profiles')          is not null, 'dibuat oleh 0001_init.sql'),
    ('Tabel weekly_trackers',   to_regclass('public.weekly_trackers')   is not null, 'dibuat oleh 0001_init.sql'),
    ('Trigger profil otomatis',
      exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal),
      'dibuat oleh 0001, diperkuat oleh 0003'),
    ('Tabel xp_events',         to_regclass('public.xp_events')         is not null, 'dibuat oleh 0002_gamification.sql'),
    ('Tabel daily_amal_logs',   to_regclass('public.daily_amal_logs')   is not null, 'dibuat oleh 0002_gamification.sql'),
    ('Tabel module_sessions',   to_regclass('public.module_sessions')   is not null, 'dibuat oleh 0002_gamification.sql'),
    ('Tabel drama_reports',     to_regclass('public.drama_reports')     is not null, 'dibuat oleh 0002_gamification.sql'),
    ('Fungsi leaderboard',      to_regprocedure('public.leaderboard(text,int)') is not null, 'dibuat oleh 0002_gamification.sql'),
    ('Fungsi ensure_profile',   to_regprocedure('public.ensure_profile()')      is not null, 'dibuat oleh 0003_signup_hardening.sql'),
    ('Fungsi setup_status',     to_regprocedure('public.setup_status()')        is not null, 'dibuat oleh 0003_signup_hardening.sql')
) as t(item, ready, keterangan);

-- Hitungan baris. Memakai fungsi sementara (pg_temp) supaya tetap aman
-- dijalankan walau tabelnya belum ada — sebuah SELECT biasa akan gagal saat
-- di-parse, bukan saat dijalankan, jadi CASE tidak cukup.
-- Fungsi ini hilang sendiri begitu sesi SQL Editor ditutup.
create or replace function pg_temp.hitung(p_relasi text)
returns bigint
language plpgsql
as $$
declare n bigint;
begin
  if to_regclass(p_relasi) is null then
    return null;
  end if;
  execute format('select count(*) from %s', p_relasi) into n;
  return n;
end;
$$;

-- Berapa akun yang sudah terdaftar, dan berapa profilnya?
select
  pg_temp.hitung('auth.users')      as jumlah_akun,
  pg_temp.hitung('public.profiles') as jumlah_profil;

-- Isi data referensi (harus 9 amalan, 10 sesi, 5 level setelah 0002 jalan).
select
  pg_temp.hitung('public.amal_items')      as amalan_yaumi,
  pg_temp.hitung('public.module_sessions') as sesi_modul,
  pg_temp.hitung('public.levels')          as level;
