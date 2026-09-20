-- =====================================================================
-- Jadikan sebuah akun sebagai ADMIN (atau MENTOR)
--
-- Jalankan di Supabase Dashboard → SQL Editor SETELAH akunnya mendaftar
-- lewat halaman /register.
--
-- Ganti alamat email di bawah kalau ingin mengangkat akun lain.
-- Nilai `role` yang valid: 'member', 'mentor', 'admin'.
--   - mentor : melihat semua peserta, menyesuaikan XP, membalas Maba Drama
--   - admin  : semua kemampuan mentor + boleh menghapus akun mentor
-- =====================================================================

-- Langkah 1 — pastikan profilnya ada. Kalau trigger pendaftaran sempat gagal,
-- baris inilah yang membuatkannya.
insert into public.profiles (id, full_name, squad, faculty, phone)
select
  u.id,
  public.derive_full_name(u.raw_user_meta_data, u.email),
  nullif(trim(u.raw_user_meta_data ->> 'squad'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'faculty'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'phone'), '')
from auth.users u
where lower(u.email) = lower('herlambangtinasihgusti@gmail.com')
on conflict (id) do nothing;

-- Langkah 2 — angkat jadi admin.
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('herlambangtinasihgusti@gmail.com');

-- Langkah 3 — periksa hasilnya dan katakan dengan jelas kalau gagal.
do $$
declare
  v_role text;
begin
  select p.role::text into v_role
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower('herlambangtinasihgusti@gmail.com');

  if v_role is null then
    raise warning 'BELUM BERHASIL: akun dengan email itu tidak ditemukan. Pastikan sudah mendaftar lewat /register lebih dulu.';
  elsif v_role = 'admin' then
    raise notice 'BERHASIL: akun sekarang berperan admin. Muat ulang aplikasi, menu "Panel Mentor" akan muncul.';
  else
    raise warning 'BELUM BERHASIL: role masih %. Jalankan blok CADANGAN di bagian bawah file ini.', v_role;
  end if;
end $$;

-- Langkah 4 — tampilkan hasil akhir.
select p.full_name, u.email, p.role, p.squad, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('herlambangtinasihgusti@gmail.com');


-- =====================================================================
-- CADANGAN — hanya kalau Langkah 3 memberi peringatan "role masih member".
--
-- Kolom `role` dijaga trigger `guard_profile_role_trigger` supaya peserta
-- tidak bisa mengangkat dirinya sendiri jadi admin. Trigger itu meloloskan
-- perintah dari SQL Editor (yang tidak punya sesi login), tapi kalau di
-- lingkunganmu ia tetap menghalangi, matikan sebentar lalu nyalakan lagi.
--
-- Hapus tanda komentar pada empat baris di bawah, lalu jalankan:
-- =====================================================================

-- alter table public.profiles disable trigger guard_profile_role_trigger;
-- update public.profiles p set role = 'admin'
--   from auth.users u where u.id = p.id
--   and lower(u.email) = lower('herlambangtinasihgusti@gmail.com');
-- alter table public.profiles enable trigger guard_profile_role_trigger;
