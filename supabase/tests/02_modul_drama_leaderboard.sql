\set ON_ERROR_STOP on
\echo '--- Modul: Andi centang sesi 1-9, Budi sesi 1-3 ---'
insert into public.module_completions (user_id, session_number)
  select '11111111-1111-1111-1111-111111111111', generate_series(1,9);
insert into public.module_completions (user_id, session_number)
  select '22222222-2222-2222-2222-222222222222', generate_series(1,3);
select public.user_total_xp('11111111-1111-1111-1111-111111111111') as andi_xp,
       public.user_total_xp('22222222-2222-2222-2222-222222222222') as budi_xp;

\echo '--- Mentor cabut sesi 9 milik Andi (data tidak sesuai): XP -200 ---'
delete from public.module_completions
 where user_id='11111111-1111-1111-1111-111111111111' and session_number=9;
select public.user_total_xp('11111111-1111-1111-1111-111111111111') as andi_xp_setelah_dicabut;

\echo '--- Maba Drama: 2 laporan di hari yang sama hanya dapat XP sekali ---'
insert into public.drama_reports (user_id, category, title, story) values
  ('11111111-1111-1111-1111-111111111111','Organisasi / kepanitiaan','Maba hilang dari grup','Tiga maba tidak pernah balas chat sejak pekan lalu dan tidak hadir dua kali.'),
  ('11111111-1111-1111-1111-111111111111','Relasi & pertemanan','Kelompok pecah dua kubu','Ada gesekan antar maba yang bikin suasana halaqah tidak nyaman sama sekali.');
select count(*) as jumlah_laporan,
       (select coalesce(sum(points),0) from public.xp_events
         where user_id='11111111-1111-1111-1111-111111111111' and source='drama_report') as xp_drama
from public.drama_reports where user_id='11111111-1111-1111-1111-111111111111';

\echo '--- Tracker mingguan: isi lalu perbarui, XP tidak boleh dobel ---'
insert into public.weekly_trackers (user_id, week_number, week_start_date, attendance,
  score_spiritual, score_academic, score_physical, score_social, score_mental, mentor_rating)
values ('11111111-1111-1111-1111-111111111111', 38, '2026-09-14', 'hadir', 4,4,3,5,4, 5);
update public.weekly_trackers set score_physical = 5
 where user_id='11111111-1111-1111-1111-111111111111' and week_number=38;
select coalesce(sum(points),0) as xp_tracker from public.xp_events
 where user_id='11111111-1111-1111-1111-111111111111' and source='weekly_tracker';

\echo '--- Penyesuaian XP oleh mentor (-150, data tidak sesuai) ---'
insert into public.xp_events (user_id, source, ref_key, points, note, created_by)
values ('11111111-1111-1111-1111-111111111111','admin_adjustment','adj:test-1',-150,
        'Kehadiran sesi 5 tidak terverifikasi','33333333-3333-3333-3333-333333333333');
select public.user_total_xp('11111111-1111-1111-1111-111111111111') as andi_final;

\echo '--- LEADERBOARD all-time ---'
select rank_position, full_name, squad, scoped_xp, level, level_name from public.leaderboard('all', 10);

\echo '--- LEADERBOARD harian ---'
select rank_position, full_name, scoped_xp from public.leaderboard('daily', 10);

\echo '--- MISSION PROGRESS Andi ---'
insert into public._test_ctx (uid) values ('11111111-1111-1111-1111-111111111111');
select * from public.mission_progress('11111111-1111-1111-1111-111111111111');
