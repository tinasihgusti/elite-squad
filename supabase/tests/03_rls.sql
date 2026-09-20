-- Jalankan sebagai peserta biasa (role authenticated + auth.uid = Budi)
delete from public._test_ctx;
insert into public._test_ctx (uid) values ('22222222-2222-2222-2222-222222222222');
grant usage on schema public, auth to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

set role authenticated;

\echo '=== 1. Peserta coba menyuntik XP langsung (harus DITOLAK) ==='
do $$ begin
  insert into public.xp_events (user_id, source, ref_key, points)
  values ('22222222-2222-2222-2222-222222222222','admin_adjustment','hack:1', 99999);
  raise warning 'GAGAL: penyuntikan XP berhasil!';
exception when insufficient_privilege then raise notice 'OK: ditolak RLS';
end $$;

\echo '=== 2. Peserta coba centang amalan untuk KEMARIN (harus DITOLAK) ==='
do $$ begin
  insert into public.daily_amal_logs (user_id, log_date, habit_key)
  values ('22222222-2222-2222-2222-222222222222', public.today_wib() - 1, 'tilawah');
  raise warning 'GAGAL: backdate berhasil!';
exception when insufficient_privilege then raise notice 'OK: ditolak RLS';
end $$;

\echo '=== 3. Peserta coba centang amalan atas nama ORANG LAIN (harus DITOLAK) ==='
do $$ begin
  insert into public.daily_amal_logs (user_id, habit_key)
  values ('11111111-1111-1111-1111-111111111111', 'hafalan');
  raise warning 'GAGAL: menulis atas nama orang lain berhasil!';
exception when insufficient_privilege then raise notice 'OK: ditolak RLS';
end $$;

\echo '=== 4. Peserta coba mengangkat diri jadi admin (harus tetap member) ==='
update public.profiles set role = 'admin' where id = '22222222-2222-2222-2222-222222222222';
select full_name, role as role_budi_setelah_percobaan from public.profiles
 where id='22222222-2222-2222-2222-222222222222';

\echo '=== 5. Peserta coba membaca laporan drama peserta lain (harus 0 baris) ==='
select count(*) as drama_milik_orang_lain_terlihat from public.drama_reports
 where user_id = '11111111-1111-1111-1111-111111111111';

\echo '=== 6. Peserta coba membalas laporannya sendiri seolah mentor (harus 0 baris terupdate) ==='
insert into public.drama_reports (user_id, category, title, story)
 values ('22222222-2222-2222-2222-222222222222','Akademik / kuliah','Maba bolos terus','Dua maba tidak pernah datang ke halaqah sejak awal semester ini.');
update public.drama_reports set mentor_reply = 'saya balas sendiri'
 where user_id = '22222222-2222-2222-2222-222222222222';
select coalesce(count(*),0) as balasan_palsu from public.drama_reports
 where user_id='22222222-2222-2222-2222-222222222222' and mentor_reply is not null;

\echo '=== 7. Alur normal peserta: centang amalan hari ini (harus BERHASIL) ==='
insert into public.daily_amal_logs (user_id, habit_key)
 values ('22222222-2222-2222-2222-222222222222','sholat_wajib');
select public.user_total_xp('22222222-2222-2222-2222-222222222222') as xp_budi;

\echo '=== 8. Leaderboard tetap bisa dibaca peserta ==='
select rank_position, full_name, scoped_xp from public.leaderboard('all', 5);

\echo '=== 9. mission_progress milik orang lain (harus kosong/0) ==='
select total_xp, sessions_done from public.mission_progress('11111111-1111-1111-1111-111111111111');
reset role;
