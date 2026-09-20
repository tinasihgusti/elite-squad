-- =====================================================================
-- Elite Squad Tracker — skema awal
-- Jalankan di Supabase Dashboard > SQL Editor (atau `supabase db push`).
-- =====================================================================

-- ---------- Enum ----------
do $$ begin
  create type public.attendance_status as enum ('hadir', 'izin', 'sakit', 'alpa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role as enum ('member', 'mentor', 'admin');
exception when duplicate_object then null; end $$;

-- ---------- Tabel: profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(trim(full_name)) between 2 and 120),
  squad       text,
  faculty     text,
  phone       text,
  role        public.user_role not null default 'member',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Tabel: weekly_trackers ----------
create table if not exists public.weekly_trackers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,

  week_number       int  not null check (week_number between 1 and 52),
  week_start_date   date not null,
  attendance        public.attendance_status not null,
  session_topic     text,

  -- Mini self-check (skala 1-5)
  score_spiritual   int not null check (score_spiritual between 1 and 5),
  score_academic    int not null check (score_academic  between 1 and 5),
  score_physical    int not null check (score_physical  between 1 and 5),
  score_social      int not null check (score_social    between 1 and 5),
  score_mental      int not null check (score_mental    between 1 and 5),

  -- Indikator harian
  habit_worship     boolean not null default false,
  habit_reading     boolean not null default false,
  habit_exercise    boolean not null default false,
  habit_sleep       boolean not null default false,
  habit_journaling  boolean not null default false,

  -- Maba Drama / problem-solving space
  drama_category    text,
  drama_story       text,
  drama_action_plan text,
  needs_followup    boolean not null default false,

  -- Feedback sesi mentoring
  mentor_rating     int check (mentor_rating between 1 and 5),
  session_feedback  text,
  suggestion        text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Satu peserta hanya punya satu entri per minggu (form bersifat upsert).
  constraint weekly_trackers_user_week_unique unique (user_id, week_number)
);

create index if not exists weekly_trackers_user_id_idx    on public.weekly_trackers (user_id);
create index if not exists weekly_trackers_week_idx       on public.weekly_trackers (week_number);
create index if not exists weekly_trackers_created_at_idx on public.weekly_trackers (created_at desc);
create index if not exists weekly_trackers_followup_idx   on public.weekly_trackers (needs_followup) where needs_followup;

-- ---------- Trigger: updated_at otomatis ----------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_weekly_trackers_updated_at on public.weekly_trackers;
create trigger set_weekly_trackers_updated_at
  before update on public.weekly_trackers
  for each row execute function public.handle_updated_at();

-- ---------- Trigger: auto-create profile saat user register ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, squad, faculty, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'squad'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'faculty'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper: cek role pengelola (mentor/admin) ----------
-- security definer supaya tidak rekursif dengan policy di tabel profiles.
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('mentor', 'admin')
  );
$$;

-- ---------- Row Level Security ----------
alter table public.profiles        enable row level security;
alter table public.weekly_trackers enable row level security;

-- profiles
drop policy if exists "profiles: baca milik sendiri" on public.profiles;
create policy "profiles: baca milik sendiri"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "profiles: buat milik sendiri" on public.profiles;
create policy "profiles: buat milik sendiri"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles: ubah milik sendiri" on public.profiles;
create policy "profiles: ubah milik sendiri"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- weekly_trackers
drop policy if exists "tracker: baca milik sendiri" on public.weekly_trackers;
create policy "tracker: baca milik sendiri"
  on public.weekly_trackers for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "tracker: isi milik sendiri" on public.weekly_trackers;
create policy "tracker: isi milik sendiri"
  on public.weekly_trackers for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "tracker: ubah milik sendiri" on public.weekly_trackers;
create policy "tracker: ubah milik sendiri"
  on public.weekly_trackers for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "tracker: hapus milik sendiri" on public.weekly_trackers;
create policy "tracker: hapus milik sendiri"
  on public.weekly_trackers for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------- View rekap untuk panel mentor/admin ----------
create or replace view public.weekly_tracker_recap
with (security_invoker = true) as
select
  t.id,
  t.user_id,
  p.full_name,
  p.squad,
  p.faculty,
  t.week_number,
  t.week_start_date,
  t.attendance,
  round(
    (t.score_spiritual + t.score_academic + t.score_physical + t.score_social + t.score_mental)::numeric / 5,
    2
  ) as average_score,
  t.needs_followup,
  t.drama_category,
  t.mentor_rating,
  t.created_at
from public.weekly_trackers t
join public.profiles p on p.id = t.user_id;
