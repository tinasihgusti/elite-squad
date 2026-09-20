-- =====================================================================
-- CEK CEPAT: apa saja yang sudah terpasang di database ini?
--
-- Tempel seluruh isi file ini ke Supabase → SQL Editor → Run.
-- Aman dijalankan kapan saja: hanya membaca, tidak mengubah apa pun,
-- dan tetap jalan walau databasenya masih benar-benar kosong.
--
-- Seluruh hasil muncul dalam SATU tabel, karena SQL Editor hanya
-- menampilkan hasil perintah terakhir.
-- =====================================================================

-- Fungsi bantu sementara: menghitung baris tanpa error kalau tabelnya
-- belum ada. SELECT biasa gagal saat di-parse, bukan saat dijalankan,
-- sehingga CASE tidak cukup. Fungsi ini hilang sendiri saat tab ditutup.
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

select * from (
  values
    (1, 'MIGRASI 0001', 'Tabel profiles',
       case when to_regclass('public.profiles')        is not null then '✅ SIAP' else '❌ BELUM' end, ''),
    (1, 'MIGRASI 0001', 'Tabel weekly_trackers',
       case when to_regclass('public.weekly_trackers') is not null then '✅ SIAP' else '❌ BELUM' end, ''),
    (1, 'MIGRASI 0001', 'Trigger profil otomatis',
       case when exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal)
            then '✅ SIAP' else '❌ BELUM' end, ''),

    (2, 'MIGRASI 0002', 'Tabel xp_events',
       case when to_regclass('public.xp_events')       is not null then '✅ SIAP' else '❌ BELUM' end, ''),
    (2, 'MIGRASI 0002', 'Tabel daily_amal_logs',
       case when to_regclass('public.daily_amal_logs') is not null then '✅ SIAP' else '❌ BELUM' end, ''),
    (2, 'MIGRASI 0002', 'Tabel module_sessions',
       case when to_regclass('public.module_sessions') is not null then '✅ SIAP' else '❌ BELUM' end, ''),
    (2, 'MIGRASI 0002', 'Tabel drama_reports',
       case when to_regclass('public.drama_reports')   is not null then '✅ SIAP' else '❌ BELUM' end, ''),
    (2, 'MIGRASI 0002', 'Fungsi leaderboard',
       case when to_regprocedure('public.leaderboard(text,int)') is not null then '✅ SIAP' else '❌ BELUM' end, ''),
    (2, 'MIGRASI 0002', 'Data amalan yaumi (harus 9)',
       case when coalesce(pg_temp.hitung('public.amal_items'), 0) >= 9 then '✅ SIAP' else '❌ BELUM' end,
       coalesce(pg_temp.hitung('public.amal_items')::text, 'tabel belum ada')),
    (2, 'MIGRASI 0002', 'Data sesi modul (harus 10)',
       case when coalesce(pg_temp.hitung('public.module_sessions'), 0) >= 10 then '✅ SIAP' else '❌ BELUM' end,
       coalesce(pg_temp.hitung('public.module_sessions')::text, 'tabel belum ada')),
    (2, 'MIGRASI 0002', 'Data level (harus 5)',
       case when coalesce(pg_temp.hitung('public.levels'), 0) >= 5 then '✅ SIAP' else '❌ BELUM' end,
       coalesce(pg_temp.hitung('public.levels')::text, 'tabel belum ada')),

    (3, 'MIGRASI 0003', 'Fungsi ensure_profile',
       case when to_regprocedure('public.ensure_profile()') is not null then '✅ SIAP' else '❌ BELUM' end, ''),
    (3, 'MIGRASI 0003', 'Fungsi setup_status',
       case when to_regprocedure('public.setup_status()')   is not null then '✅ SIAP' else '❌ BELUM' end, ''),

    (4, 'MIGRASI 0004', 'Policy profiles sudah aman',
       case when to_regclass('public.profiles') is null then '❌ BELUM'
            when exists (
              select 1 from pg_policies
              where schemaname = 'public' and tablename = 'profiles'
                and (qual = 'true' or with_check = 'true')
            ) then '🔴 TERBUKA' else '✅ SIAP' end,
       case when to_regclass('public.profiles') is null then 'tabel belum ada'
            else (select count(*)::text || ' policy terpasang' from pg_policies
                  where schemaname = 'public' and tablename = 'profiles') end),

    (5, 'DATA AKUN', 'Akun terdaftar (auth.users)',
       'ℹ️ INFO', coalesce(pg_temp.hitung('auth.users')::text, '-')),
    (5, 'DATA AKUN', 'Profil terbentuk (public.profiles)',
       'ℹ️ INFO', coalesce(pg_temp.hitung('public.profiles')::text, 'tabel belum ada'))
) as t(urutan, bagian, item, status, keterangan)
order by urutan, item;
