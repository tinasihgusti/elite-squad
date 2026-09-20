-- =====================================================================
-- Elite Squad Tracker — gamifikasi, amalan yaumi, modul, dan panel mentor
-- Mengacu pada "Modul Pembinaan & Blueprint Program: Elite Squad" (V2).
-- Jalankan SETELAH 0001_init.sql.
-- =====================================================================

-- ---------- Helper waktu (program berjalan di WIB) ----------
create or replace function public.today_wib()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Jakarta')::date;
$$;

-- =====================================================================
-- 1. Data referensi
-- =====================================================================

-- ---------- Level / rank, dipetakan ke Fase Roadmap pada modul ----------
create table if not exists public.levels (
  level        int primary key,
  name         text not null,
  min_xp       int  not null,
  description  text not null
);

insert into public.levels (level, name, min_xp, description) values
  (1, 'Rookie Assistant',      0,    'Baru bergabung. Fokus pelurusan niat dan penguatan aqidah (Fase 2, Sesi 1-3).'),
  (2, 'Grounded Assistant',    300,  'Ritme ibadah mulai stabil dan hadir konsisten di sesi awal.'),
  (3, 'Resilient Assistant',   900,  'Lolos mid-program check: manajemen waktu dan delegasi tugas jalan (Fase 3, Sesi 4-7).'),
  (4, 'Facilitator Assistant', 1800, 'Siap simulasi fasilitasi kelas dan menangani studi kasus maba (Fase 4, Sesi 8-9).'),
  (5, 'Elite Assistant',       3000, 'Badge kelulusan program. Tuntas 10 sesi dan amalan yaumi terjaga (Fase 5, Sesi 10).')
on conflict (level) do update
  set name = excluded.name, min_xp = excluded.min_xp, description = excluded.description;

create or replace function public.level_for_xp(p_xp bigint)
returns int
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select l.level from public.levels l where l.min_xp <= greatest(p_xp, 0) order by l.min_xp desc limit 1),
    1
  );
$$;

-- ---------- Amalan yaumi (indikator harian dari modul) ----------
create table if not exists public.amal_items (
  key         text primary key,
  label       text not null,
  description text,
  xp_reward   int  not null default 10 check (xp_reward between 0 and 100),
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);

insert into public.amal_items (key, label, description, xp_reward, sort_order) values
  ('sholat_wajib',     'Sholat wajib on-time',      'Lima waktu tidak bolong, diusahakan di awal waktu. (Sesi 2 — Sahihul Ibadah)',        15, 1),
  ('tilawah',          'Tilawah Al-Qur''an',        'Minimal satu halaman hari ini. (Sesi 2 — Spiritual Fuel)',                             10, 2),
  ('hafalan',          'Murojaah / cicil hafalan',  'Adh-Dhuha s.d An-Naas & Arbain 1-10. (Sesi 3 — Aesthetic & Clean Habits)',             10, 3),
  ('dzikir_istighfar', 'Dzikir & istighfar',        'Manajemen emosi lewat dzikir. (Sesi 4 — Resilience & Energy Mastery)',                 10, 4),
  ('doa_fardhu',       'Doa pasca sholat fardhu',   'Tidak langsung bubar setelah salam. (Sesi 4 — Qadirun ''Ala Nafsih)',                  10, 5),
  ('olahraga',         'Olahraga / gerak badan',    'Min. 30 menit. (Sesi 4 — Qawiyyul Ajsam)',                                             10, 6),
  ('jaga_lisan',       'Jaga lisan & amanah',       'Jujur, tidak ghibah, menepati janji. (Sesi 5 — High-Value Integrity)',                 10, 7),
  ('birrul_walidain',  'Berbakti pada orang tua',   'Kabari atau bantu orang tua hari ini. (Sesi 9 — Filial Piety)',                        10, 8),
  ('baca_ilmu',        'Membaca / menuntut ilmu',   'Minimal 15 menit di luar tugas kuliah. (Sesi 9 — Kepedulian Sosial)',                  10, 9)
on conflict (key) do update
  set label = excluded.label, description = excluded.description,
      xp_reward = excluded.xp_reward, sort_order = excluded.sort_order;

-- ---------- Kurikulum 10 pertemuan (Bab 4 modul) ----------
create table if not exists public.module_sessions (
  session_number    int primary key check (session_number between 1 and 10),
  phase             text not null,
  theme             text not null,
  title             text not null,
  focus             text not null,
  juklak_indicator  text not null,
  delivery          text not null,
  xp_reward         int  not null default 200
);

insert into public.module_sessions
  (session_number, phase, theme, title, focus, juklak_indicator, delivery) values
  (1,  'Fase 2 — Kick-Off & Fondasi Mental', 'Salimul ''Aqidah', 'Grounded Mindset: Why We Do This',
   'Membangun kesadaran hari akhir dan muroqobatullah (merasa diawasi Allah) agar malu berbuat dosa.',
   'Beriman hari akhir, merasa malu berbuat dosa.',
   'Reflective Journaling: menuliskan 3 alasan personal bertahan jadi asisten, lalu sharing melingkar tanpa penghakiman.'),
  (2,  'Fase 2 — Kick-Off & Fondasi Mental', 'Sahihul ''Ibadah', 'Spiritual Fuel: Recharge Energi',
   'Menjaga sholat wajib & tilawah, tawakal penuh kepada Allah, serta bersih dari praktik mistis/dukun/jimat.',
   'Semangat ibadah, anti-dukun/jimat, tawakal, pemahaman Islam/Iman/Ihsan.',
   'Habit Tracker Audit: diskusi kelompok kecil memetakan hambatan ibadah harian dan solusi praktisnya.'),
  (3,  'Fase 2 — Kick-Off & Fondasi Mental', 'Thoharoh & Hafalan', 'Aesthetic & Clean Habits',
   'Praktik thoharoh benar (wudhu, tayamum, mandi wajib/haid), cicil hafalan Adh-Dhuha s.d An-Naas & Arbain 1-10 dengan adab Quran.',
   'Thoharoh benar, hafalan surat pendek & Arbain, adab Quran.',
   'Quick Quiz & Recitation Circle: kuis interaktif ringan dan setoran hafalan santai bersama mentor.'),
  (4,  'Fase 3 — Mid-Program Check', 'Qadirun ''Ala Nafsih & Qawiyyul Ajsam', 'Resilience & Energy Mastery',
   'Manajemen emosi dengan dzikir/istighfar, doa pasca sholat fardhu, serta jaga stamina fisik lewat olahraga rutin min. 30 menit.',
   'Banyak istighfar/dzikir, doa pasca sholat fardhu, olahraga rutin min. 30 menit.',
   'Wellness Check & Stretching: cek kesehatan fisik singkat diselingi peregangan otot bersama.'),
  (5,  'Fase 3 — Mid-Program Check', 'Matinul Khuluq & Halal-Thoyyib', 'High-Value Integrity',
   'Komitmen jujur, amanah, anti-sombong, selektif mencari rezeki halal & menjauhi haram/syubhat serta makanan halal-thoyyib.',
   'Jujur & amanah, anti-sombong, halal-haram/syubhat, makanan halal-thoyyib.',
   'Case Study Decision Making: membedah skenario dilema etika sehari-hari mahasiswa.'),
  (6,  'Fase 3 — Mid-Program Check', 'Mutsaqqafun Fikrihi & Wawasan', 'Smart & National Pride',
   'Paham pilar Islam/Iman/Ihsan & tanda kiamat, cinta tanah air, sejarah kemerdekaan Indonesia, dan pemahaman anti-korupsi.',
   'Tanda kiamat, cinta & bela tanah air, sejarah kemerdekaan, berbagai bentuk korupsi.',
   'Interactive Trivia & Discussion: kuis trivia sejarah kebangsaan dan bedah kasus korupsi ringan.'),
  (7,  'Fase 3 — Mid-Program Check', 'Profesionalisme', 'Service Excellence & Purpose',
   'Menjalankan peran asisten/kuliah sebagai sarana ibadah dan memberikan pelayanan prima kepada maba.',
   'Profesi sebagai sarana ibadah, pelayanan prima sebagai akhlak muslim.',
   'Roleplay Pelayanan Asistensi: simulasi menghadapi maba rewel dengan pendekatan service excellence.'),
  (8,  'Fase 4 — Execution & Simulation', 'Kerjasama & Toleransi', 'Team Player & Unity',
   'Menjadi pendengar yang baik, memahami pentingnya kerja sama tim, dan merawat persatuan umat dengan toleransi furu''.',
   'Pendengar yang baik, pentingnya kerja sama, persatuan umat Islam / toleransi furu''.',
   'Active Listening Simulation: latihan komunikasi dua arah dan empati kelompok.'),
  (9,  'Fase 4 — Execution & Simulation', 'Kepedulian Sosial', 'Social Impact & Filial Piety',
   'Berbakti kepada orang tua, gemar membaca/menuntut ilmu, serta aktif berinteraksi dan berkontribusi di masyarakat sekitar.',
   'Berbakti kepada orang tua, gemar membaca/ilmu, interaksi dengan masyarakat sekitar.',
   'Action Plan Project: menyusun rencana aksi kontribusi sosial kelompok atau apresiasi orang tua.'),
  (10, 'Fase 5 — Graduation & Showcase', 'Nafi''un Lighairihi & Graduation', 'The Elite Squad Showcase',
   'Senang berbuat kebaikan tanpa pamrih, evaluasi total progres kelompok, dan selebrasi kelulusan asisten.',
   'Senang berbuat kebaikan tanpa pamrih, pencapaian 100% indikator level.',
   'Appreciation Night & Awarding: malam keakraban, penganugerahan badge Elite Assistant, dan open mic testimoni.')
on conflict (session_number) do update
  set phase = excluded.phase, theme = excluded.theme, title = excluded.title,
      focus = excluded.focus, juklak_indicator = excluded.juklak_indicator,
      delivery = excluded.delivery;

-- =====================================================================
-- 2. Ledger XP — satu-satunya sumber kebenaran skor & leaderboard
-- =====================================================================

do $$ begin
  create type public.xp_source as enum (
    'daily_amal', 'daily_bonus', 'module_session', 'drama_report', 'weekly_tracker', 'admin_adjustment'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.xp_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  source       public.xp_source not null,
  -- Kunci idempoten. Satu ref_key = satu kali poin, sehingga centang-batal-centang
  -- tidak pernah menghasilkan XP ganda.
  ref_key      text not null,
  points       int  not null,
  note         text,
  occurred_on  date not null default public.today_wib(),
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint xp_events_user_ref_unique unique (user_id, ref_key)
);

create index if not exists xp_events_user_idx        on public.xp_events (user_id);
create index if not exists xp_events_occurred_idx    on public.xp_events (occurred_on desc);
create index if not exists xp_events_user_date_idx   on public.xp_events (user_id, occurred_on);

create or replace function public.user_total_xp(p_user uuid)
returns bigint
language sql
stable
set search_path = public
as $$
  select coalesce(sum(points), 0)::bigint from public.xp_events where user_id = p_user;
$$;

-- =====================================================================
-- 3. Amalan yaumi harian — reset otomatis per tanggal, bisa di-undo
-- =====================================================================

-- Tidak ada kolom "checked". Tercentang = barisnya ada; undo = barisnya dihapus.
-- Hari baru otomatis kosong karena log_date ikut tanggal berjalan (WIB).
create table if not exists public.daily_amal_logs (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  log_date   date not null default public.today_wib(),
  habit_key  text not null references public.amal_items (key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, log_date, habit_key)
);

create index if not exists daily_amal_logs_date_idx on public.daily_amal_logs (log_date desc);

create or replace function public.sync_amal_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user      uuid;
  v_date      date;
  v_total     int;
  v_done      int;
  v_bonus_key text;
begin
  if tg_op = 'INSERT' then
    v_user := new.user_id;
    v_date := new.log_date;

    insert into public.xp_events (user_id, source, ref_key, points, occurred_on, note)
    select new.user_id,
           'daily_amal',
           format('amal:%s:%s', new.log_date, new.habit_key),
           a.xp_reward,
           new.log_date,
           'Amalan yaumi: ' || a.label
    from public.amal_items a
    where a.key = new.habit_key
    on conflict (user_id, ref_key) do nothing;
  else
    v_user := old.user_id;
    v_date := old.log_date;

    delete from public.xp_events
    where user_id = old.user_id
      and ref_key = format('amal:%s:%s', old.log_date, old.habit_key);
  end if;

  -- Bonus "amalan yaumi terbaik": hanya saat seluruh item aktif tercentang.
  -- Ikut hilang otomatis kalau salah satu di-undo.
  select count(*) into v_total from public.amal_items where is_active;

  select count(*) into v_done
  from public.daily_amal_logs l
  join public.amal_items a on a.key = l.habit_key and a.is_active
  where l.user_id = v_user and l.log_date = v_date;

  v_bonus_key := format('amal-bonus:%s', v_date);

  if v_total > 0 and v_done >= v_total then
    insert into public.xp_events (user_id, source, ref_key, points, occurred_on, note)
    values (v_user, 'daily_bonus', v_bonus_key, 50, v_date, 'Bonus: amalan yaumi lengkap')
    on conflict (user_id, ref_key) do nothing;
  else
    delete from public.xp_events where user_id = v_user and ref_key = v_bonus_key;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_amal_xp_trigger on public.daily_amal_logs;
create trigger sync_amal_xp_trigger
  after insert or delete on public.daily_amal_logs
  for each row execute function public.sync_amal_xp();

-- =====================================================================
-- 4. Penyelesaian modul (10 pertemuan)
-- =====================================================================

create table if not exists public.module_completions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  session_number int  not null references public.module_sessions (session_number) on delete cascade,
  reflection     text,
  completed_on   date not null default public.today_wib(),
  -- Mentor memverifikasi kehadiran; centang mandiri tetap dapat XP,
  -- tapi mentor bisa mencabutnya lewat panel kalau data tidak sesuai.
  verified_by    uuid references public.profiles (id) on delete set null,
  verified_at    timestamptz,
  created_at     timestamptz not null default now(),
  constraint module_completions_user_session_unique unique (user_id, session_number)
);

create index if not exists module_completions_user_idx on public.module_completions (user_id);

create or replace function public.sync_module_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.xp_events (user_id, source, ref_key, points, occurred_on, note)
    select new.user_id,
           'module_session',
           format('session:%s', new.session_number),
           s.xp_reward,
           new.completed_on,
           format('Sesi %s — %s', s.session_number, s.title)
    from public.module_sessions s
    where s.session_number = new.session_number
    on conflict (user_id, ref_key) do nothing;
  else
    delete from public.xp_events
    where user_id = old.user_id
      and ref_key = format('session:%s', old.session_number);
  end if;

  return null;
end;
$$;

drop trigger if exists sync_module_xp_trigger on public.module_completions;
create trigger sync_module_xp_trigger
  after insert or delete on public.module_completions
  for each row execute function public.sync_module_xp();

-- =====================================================================
-- 5. Maba Drama Box (Bagian 3 GForm pada modul)
-- =====================================================================

create table if not exists public.drama_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  category     text not null,
  title        text not null check (char_length(trim(title)) between 5 and 140),
  story        text not null check (char_length(trim(story)) between 20 and 2000),
  is_urgent    boolean not null default false,
  reported_on  date not null default public.today_wib(),
  -- "Cheat code" solusi praktis dari mentor alumni.
  mentor_reply text,
  replied_by   uuid references public.profiles (id) on delete set null,
  replied_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists drama_reports_user_idx    on public.drama_reports (user_id, created_at desc);
create index if not exists drama_reports_pending_idx on public.drama_reports (created_at desc) where mentor_reply is null;

drop trigger if exists set_drama_reports_updated_at on public.drama_reports;
create trigger set_drama_reports_updated_at
  before update on public.drama_reports
  for each row execute function public.handle_updated_at();

create or replace function public.sync_drama_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  -- XP dibatasi satu kali per hari supaya leaderboard tidak bisa dipompa
  -- dengan mengirim laporan beruntun.
  if tg_op = 'INSERT' then
    insert into public.xp_events (user_id, source, ref_key, points, occurred_on, note)
    values (new.user_id, 'drama_report', format('drama:%s', new.reported_on), 40, new.reported_on,
            'Laporan Maba Drama')
    on conflict (user_id, ref_key) do nothing;
    return null;
  end if;

  v_key := format('drama:%s', old.reported_on);

  if not exists (
    select 1 from public.drama_reports
    where user_id = old.user_id and reported_on = old.reported_on and id <> old.id
  ) then
    delete from public.xp_events where user_id = old.user_id and ref_key = v_key;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_drama_xp_trigger on public.drama_reports;
create trigger sync_drama_xp_trigger
  after insert or delete on public.drama_reports
  for each row execute function public.sync_drama_xp();

-- =====================================================================
-- 6. XP untuk tracker mingguan (form dari 0001)
-- =====================================================================

create or replace function public.sync_weekly_tracker_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.xp_events
    where user_id = old.user_id and ref_key = format('tracker:%s', old.week_number);
    return null;
  end if;

  -- `on conflict do nothing` membuat pembaruan isian tidak menambah XP lagi.
  insert into public.xp_events (user_id, source, ref_key, points, occurred_on, note)
  values (new.user_id, 'weekly_tracker', format('tracker:%s', new.week_number), 100,
          new.week_start_date, format('Tracker Minggu %s', new.week_number))
  on conflict (user_id, ref_key) do nothing;

  return null;
end;
$$;

drop trigger if exists sync_weekly_tracker_xp_trigger on public.weekly_trackers;
create trigger sync_weekly_tracker_xp_trigger
  after insert or update or delete on public.weekly_trackers
  for each row execute function public.sync_weekly_tracker_xp();

-- =====================================================================
-- 7. Perbaikan keamanan: kunci kolom `role` dari peserta
-- =====================================================================

-- Policy "profiles: ubah milik sendiri" di 0001 mengizinkan update seluruh
-- kolom, termasuk `role` — peserta bisa mengangkat dirinya jadi admin.
-- Trigger ini mengunci kolom itu: hanya staf yang boleh mengubahnya.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() null berarti perintah datang dari SQL Editor / service_role
  -- (bukan request peserta), jadi promosi mentor lewat dashboard tetap bisa.
  -- Request peserta selalu punya uid, dan hanya staf yang boleh mengubah role.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_staff(auth.uid()) then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_trigger on public.profiles;
create trigger guard_profile_role_trigger
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- =====================================================================
-- 8. Row Level Security
-- =====================================================================

alter table public.levels             enable row level security;
alter table public.amal_items         enable row level security;
alter table public.module_sessions    enable row level security;
alter table public.xp_events          enable row level security;
alter table public.daily_amal_logs    enable row level security;
alter table public.module_completions enable row level security;
alter table public.drama_reports      enable row level security;

-- ---------- Data referensi: boleh dibaca semua user login ----------
drop policy if exists "levels: baca" on public.levels;
create policy "levels: baca" on public.levels for select to authenticated using (true);

drop policy if exists "amal_items: baca" on public.amal_items;
create policy "amal_items: baca" on public.amal_items for select to authenticated using (true);

drop policy if exists "module_sessions: baca" on public.module_sessions;
create policy "module_sessions: baca" on public.module_sessions for select to authenticated using (true);

-- ---------- xp_events ----------
-- Peserta hanya boleh MEMBACA. Penambahan XP seluruhnya lewat trigger
-- SECURITY DEFINER, sehingga skor tidak bisa dikarang dari sisi client.
drop policy if exists "xp: baca milik sendiri" on public.xp_events;
create policy "xp: baca milik sendiri"
  on public.xp_events for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "xp: penyesuaian oleh staf" on public.xp_events;
create policy "xp: penyesuaian oleh staf"
  on public.xp_events for insert to authenticated
  with check (public.is_staff(auth.uid()) and source = 'admin_adjustment');

drop policy if exists "xp: hapus penyesuaian oleh staf" on public.xp_events;
create policy "xp: hapus penyesuaian oleh staf"
  on public.xp_events for delete to authenticated
  using (public.is_staff(auth.uid()) and source = 'admin_adjustment');

-- ---------- daily_amal_logs ----------
-- Insert & delete dibatasi tanggal hari ini: peserta bisa undo sepuasnya
-- hari itu, tapi tidak bisa mengisi mundur hari kemarin.
drop policy if exists "amal: baca milik sendiri" on public.daily_amal_logs;
create policy "amal: baca milik sendiri"
  on public.daily_amal_logs for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "amal: centang hari ini" on public.daily_amal_logs;
create policy "amal: centang hari ini"
  on public.daily_amal_logs for insert to authenticated
  with check (user_id = auth.uid() and log_date = public.today_wib());

drop policy if exists "amal: undo hari ini" on public.daily_amal_logs;
create policy "amal: undo hari ini"
  on public.daily_amal_logs for delete to authenticated
  using (user_id = auth.uid() and log_date = public.today_wib());

drop policy if exists "amal: koreksi oleh staf" on public.daily_amal_logs;
create policy "amal: koreksi oleh staf"
  on public.daily_amal_logs for delete to authenticated
  using (public.is_staff(auth.uid()));

-- ---------- module_completions ----------
drop policy if exists "modul: baca milik sendiri" on public.module_completions;
create policy "modul: baca milik sendiri"
  on public.module_completions for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "modul: centang milik sendiri" on public.module_completions;
create policy "modul: centang milik sendiri"
  on public.module_completions for insert to authenticated
  with check (user_id = auth.uid() and verified_by is null and verified_at is null);

drop policy if exists "modul: batalkan milik sendiri" on public.module_completions;
create policy "modul: batalkan milik sendiri"
  on public.module_completions for delete to authenticated
  using (user_id = auth.uid() and verified_at is null);

drop policy if exists "modul: verifikasi oleh staf" on public.module_completions;
create policy "modul: verifikasi oleh staf"
  on public.module_completions for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "modul: cabut oleh staf" on public.module_completions;
create policy "modul: cabut oleh staf"
  on public.module_completions for delete to authenticated
  using (public.is_staff(auth.uid()));

-- ---------- drama_reports ----------
drop policy if exists "drama: baca milik sendiri" on public.drama_reports;
create policy "drama: baca milik sendiri"
  on public.drama_reports for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "drama: kirim milik sendiri" on public.drama_reports;
create policy "drama: kirim milik sendiri"
  on public.drama_reports for insert to authenticated
  with check (
    user_id = auth.uid()
    and mentor_reply is null
    and replied_by is null
    and reported_on = public.today_wib()
  );

drop policy if exists "drama: hapus milik sendiri" on public.drama_reports;
create policy "drama: hapus milik sendiri"
  on public.drama_reports for delete to authenticated
  using (user_id = auth.uid() and mentor_reply is null);

drop policy if exists "drama: balas oleh staf" on public.drama_reports;
create policy "drama: balas oleh staf"
  on public.drama_reports for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Peserta tidak punya policy UPDATE, jadi `mentor_reply` mustahil diisi sendiri.

-- =====================================================================
-- 9. Leaderboard & progres misi
-- =====================================================================

-- SECURITY DEFINER: leaderboard memang perlu menampilkan nama peserta lain,
-- tapi hanya kolom aman (nama, squad, XP). Email dan nomor WA tidak ikut.
create or replace function public.leaderboard(
  p_scope text default 'all',
  p_limit int  default 50
)
returns table (
  user_id     uuid,
  full_name   text,
  squad       text,
  faculty     text,
  scoped_xp   bigint,
  total_xp    bigint,
  level       int,
  level_name  text,
  rank_position bigint
)
language sql
security definer
stable
set search_path = public
as $$
  with totals as (
    select e.user_id, sum(e.points)::bigint as total_xp
    from public.xp_events e
    group by e.user_id
  ),
  scoped as (
    select e.user_id, sum(e.points)::bigint as scoped_xp
    from public.xp_events e
    where case
            when p_scope = 'daily'   then e.occurred_on = public.today_wib()
            when p_scope = 'weekly'  then e.occurred_on > public.today_wib() - 7
            when p_scope = 'monthly' then e.occurred_on > public.today_wib() - 30
            else true
          end
    group by e.user_id
  )
  select
    p.id,
    p.full_name,
    p.squad,
    p.faculty,
    coalesce(s.scoped_xp, 0),
    coalesce(t.total_xp, 0),
    l.level,
    l.name,
    rank() over (order by coalesce(s.scoped_xp, 0) desc, p.full_name asc)
  from public.profiles p
  left join totals t on t.user_id = p.id
  left join scoped s on s.user_id = p.id
  join public.levels l on l.level = public.level_for_xp(coalesce(t.total_xp, 0))
  where p.role = 'member'
    and coalesce(s.scoped_xp, 0) > 0
  order by coalesce(s.scoped_xp, 0) desc, p.full_name asc
  limit greatest(p_limit, 1);
$$;

revoke all on function public.leaderboard(text, int) from public;
grant execute on function public.leaderboard(text, int) to authenticated;

-- Ringkasan progres satu peserta: XP, level, dan status misi kelulusan.
create or replace function public.mission_progress(p_user uuid default auth.uid())
returns table (
  total_xp            bigint,
  today_xp            bigint,
  level               int,
  level_name          text,
  next_level_min_xp   int,
  sessions_total      bigint,
  sessions_done       bigint,
  sessions_verified   bigint,
  attendance_percent  numeric,
  amal_today_done     bigint,
  amal_today_total    bigint,
  amal_streak_days    int,
  graduated           boolean
)
language sql
security definer
stable
set search_path = public
as $$
  with guard as (
    -- Peserta hanya boleh melihat progresnya sendiri; staf boleh melihat siapa pun.
    select case
             when p_user = auth.uid() or public.is_staff(auth.uid()) then p_user
             else null::uuid
           end as uid
  ),
  xp as (
    select coalesce(sum(points), 0)::bigint as total,
           coalesce(sum(points) filter (where occurred_on = public.today_wib()), 0)::bigint as today
    from public.xp_events where user_id = (select uid from guard)
  ),
  sess as (
    select (select count(*) from public.module_sessions) as total,
           count(*) as done,
           count(*) filter (where verified_at is not null) as verified
    from public.module_completions where user_id = (select uid from guard)
  ),
  amal as (
    select (select count(*) from public.amal_items where is_active) as total,
           count(*) as done
    from public.daily_amal_logs l
    join public.amal_items a on a.key = l.habit_key and a.is_active
    where l.user_id = (select uid from guard) and l.log_date = public.today_wib()
  ),
  -- Streak: hitung mundur dari hari ini selama masih ada amalan tercatat.
  streak as (
    select count(*)::int as len
    from (
      select d.log_date,
             (row_number() over (order by d.log_date desc))::int as rn
      from (
        select distinct log_date
        from public.daily_amal_logs
        where user_id = (select uid from guard) and log_date <= public.today_wib()
      ) d
    ) x
    where x.log_date = public.today_wib() - (x.rn - 1)
  )
  select
    xp.total,
    xp.today,
    lv.level,
    lv.name,
    (select min(min_xp) from public.levels where min_xp > xp.total),
    sess.total,
    sess.done,
    sess.verified,
    round(sess.done::numeric * 100 / nullif(sess.total, 0), 1),
    amal.done,
    amal.total,
    coalesce(streak.len, 0),
    -- Kelulusan mengikuti modul: minimal 80% kehadiran sesi DAN XP level 5.
    (
      sess.done::numeric >= sess.total::numeric * 0.8
      and xp.total >= (select min_xp from public.levels where level = 5)
    )
  from xp
  cross join sess
  cross join amal
  cross join streak
  join public.levels lv on lv.level = public.level_for_xp(xp.total);
$$;

revoke all on function public.mission_progress(uuid) from public;
grant execute on function public.mission_progress(uuid) to authenticated;

-- =====================================================================
-- 10. Ringkasan peserta untuk panel mentor
-- =====================================================================

-- Satu query agregat untuk seluruh peserta, supaya panel mentor tidak
-- menembak 200 query terpisah (N+1) saat menampilkan tabel.
create or replace function public.admin_participants()
returns table (
  user_id          uuid,
  full_name        text,
  squad            text,
  faculty          text,
  phone            text,
  role             public.user_role,
  total_xp         bigint,
  today_xp         bigint,
  level            int,
  level_name       text,
  sessions_done    bigint,
  sessions_verified bigint,
  amal_logged_days bigint,
  drama_count      bigint,
  last_active_on   date,
  joined_at        timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.squad,
    p.faculty,
    p.phone,
    p.role,
    coalesce(x.total, 0),
    coalesce(x.today, 0),
    l.level,
    l.name,
    coalesce(m.done, 0),
    coalesce(m.verified, 0),
    coalesce(a.days, 0),
    coalesce(d.count, 0),
    x.last_on,
    p.created_at
  from public.profiles p
  left join lateral (
    select sum(points)::bigint as total,
           coalesce(sum(points) filter (where occurred_on = public.today_wib()), 0)::bigint as today,
           max(occurred_on) as last_on
    from public.xp_events e where e.user_id = p.id
  ) x on true
  left join lateral (
    select count(*)::bigint as done,
           count(*) filter (where verified_at is not null)::bigint as verified
    from public.module_completions c where c.user_id = p.id
  ) m on true
  left join lateral (
    select count(distinct log_date)::bigint as days
    from public.daily_amal_logs g where g.user_id = p.id
  ) a on true
  left join lateral (
    select count(*)::bigint as count
    from public.drama_reports r where r.user_id = p.id
  ) d on true
  join public.levels l on l.level = public.level_for_xp(coalesce(x.total, 0))
  -- Gerbang akses: non-staf tidak mendapat satu baris pun.
  where public.is_staff(auth.uid())
  order by coalesce(x.total, 0) desc, p.full_name asc;
$$;

revoke all on function public.admin_participants() from public;
grant execute on function public.admin_participants() to authenticated;
