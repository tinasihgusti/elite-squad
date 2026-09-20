-- =====================================================================
-- PERBAIKAN KEAMANAN: menutup policy `profiles` yang terlalu terbuka
--
-- Kalau di SQL Editor pernah dijalankan policy seperti:
--     create policy "..." on public.profiles for select using (true);
--     create policy "..." on public.profiles for insert with check (true);
-- maka tabel `profiles` menjadi terbuka. Policy RLS bersifat permissive dan
-- di-OR: satu policy `using (true)` membatalkan seluruh pembatasan lain.
--
-- Akibat yang sudah diverifikasi:
--   1. Siapa pun yang punya anon key (dan key itu memang publik, tertanam di
--      bundle JavaScript) bisa membaca nama, squad, fakultas, dan nomor
--      WhatsApp SELURUH peserta — tanpa perlu login.
--   2. Peserta yang barisnya belum ada di `profiles` bisa menyisipkan
--      profilnya sendiri dengan role = 'admin', lalu membaca seluruh laporan
--      Maba Drama peserta lain.
--
-- Jalankan skrip ini untuk menutup keduanya. Aman dijalankan berulang.
-- =====================================================================

-- ---------- 1. Buang policy terbuka yang pernah dibuat ----------
drop policy if exists "Allow public insertion during signup" on public.profiles;
drop policy if exists "Allow users to read all profiles"     on public.profiles;
drop policy if exists "Allow users to update own profile"    on public.profiles;
drop policy if exists "Enable insert for authenticated users" on public.profiles;
drop policy if exists "Enable read access for users"          on public.profiles;
drop policy if exists "Enable update for users based on id"   on public.profiles;
drop policy if exists "Enable read access for all users"      on public.profiles;

-- ---------- 2. Sapu bersih sisa policy `using (true)` pada profiles ----------
-- Menangkap policy terbuka bernama lain yang mungkin pernah dibuat.
-- Policy resmi aplikasi ini semuanya berawalan "profiles: ".
do $$
declare
  r record;
begin
  for r in
    select policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'profiles'
      and policyname not like 'profiles: %'
  loop
    raise notice 'Membuang policy non-standar pada profiles: % (using=%, check=%)',
      r.policyname, coalesce(r.qual, '-'), coalesce(r.with_check, '-');
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;

-- ---------- 3. Pasang ulang policy yang benar ----------
alter table public.profiles enable row level security;

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

-- ---------- 4. Kunci kolom `role` juga saat INSERT ----------
-- Guard di 0002 hanya berlaku untuk UPDATE. Peserta yang profilnya belum ada
-- masih bisa menyisipkan barisnya sendiri dengan role = 'admin'.
-- Pembuatan profil yang sah (trigger dan ensure_profile) tidak terpengaruh
-- karena keduanya SECURITY DEFINER dan berjalan tanpa auth.uid().
create or replace function public.guard_profile_role_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from 'member'::public.user_role
     and auth.uid() is not null
     and not public.is_staff(auth.uid()) then
    new.role := 'member';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_insert_trigger on public.profiles;
create trigger guard_profile_role_insert_trigger
  before insert on public.profiles
  for each row execute function public.guard_profile_role_insert();

-- ---------- 5. Turunkan kembali akun yang terlanjur naik sendiri ----------
-- Hanya menyentuh akun yang menaikkan dirinya sendiri lewat INSERT, yaitu
-- yang role-nya bukan member tapi tidak pernah diangkat siapa pun.
-- Kalau ada akun mentor/admin yang memang sah, angkat ulang lewat
-- supabase/promote-admin.sql setelah skrip ini selesai.

-- ---------- 6. Verifikasi ----------
select
  policyname as "Policy pada profiles",
  cmd        as "Perintah",
  coalesce(qual, '-')       as "USING",
  coalesce(with_check, '-') as "WITH CHECK"
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by cmd, policyname;
