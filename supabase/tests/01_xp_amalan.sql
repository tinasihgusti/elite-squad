\set ON_ERROR_STOP on
-- Dua peserta + satu mentor
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','andi@test.id','{"full_name":"Andi Pratama","squad":"Squad 1"}'),
  ('22222222-2222-2222-2222-222222222222','budi@test.id','{"full_name":"Budi Santoso","squad":"Squad 2"}'),
  ('33333333-3333-3333-3333-333333333333','mentor@test.id','{"full_name":"Mentor Alumni","squad":"Mentor"}');
update public.profiles set role='mentor' where id='33333333-3333-3333-3333-333333333333';

\echo '--- profil auto-dibuat oleh trigger ---'
select full_name, squad, role from public.profiles order by full_name;

\echo '--- Andi centang 3 amalan ---'
insert into public.daily_amal_logs (user_id, habit_key) values
  ('11111111-1111-1111-1111-111111111111','sholat_wajib'),
  ('11111111-1111-1111-1111-111111111111','tilawah'),
  ('11111111-1111-1111-1111-111111111111','olahraga');
select public.user_total_xp('11111111-1111-1111-1111-111111111111') as xp_after_3_amalan;

\echo '--- UNDO tilawah: XP harus turun 10 ---'
delete from public.daily_amal_logs
 where user_id='11111111-1111-1111-1111-111111111111' and habit_key='tilawah' and log_date=public.today_wib();
select public.user_total_xp('11111111-1111-1111-1111-111111111111') as xp_after_undo;

\echo '--- Centang ulang tilawah (tidak boleh dobel) ---'
insert into public.daily_amal_logs (user_id, habit_key) values ('11111111-1111-1111-1111-111111111111','tilawah');
select public.user_total_xp('11111111-1111-1111-1111-111111111111') as xp_after_recheck;

\echo '--- Andi lengkapi SEMUA amalan: bonus 50 harus muncul ---'
insert into public.daily_amal_logs (user_id, habit_key)
  select '11111111-1111-1111-1111-111111111111', key from public.amal_items where is_active
  on conflict do nothing;
select public.user_total_xp('11111111-1111-1111-1111-111111111111') as xp_lengkap,
       (select points from public.xp_events
         where user_id='11111111-1111-1111-1111-111111111111' and source='daily_bonus') as bonus;

\echo '--- Undo satu amalan: bonus harus ikut hilang ---'
delete from public.daily_amal_logs
 where user_id='11111111-1111-1111-1111-111111111111' and habit_key='olahraga' and log_date=public.today_wib();
select public.user_total_xp('11111111-1111-1111-1111-111111111111') as xp_setelah_bonus_batal,
       (select count(*) from public.xp_events
         where user_id='11111111-1111-1111-1111-111111111111' and source='daily_bonus') as sisa_bonus;
