-- Skenario nyata dari produksi: tabel `profiles` sudah pernah dibuat skrip lain
-- (contoh bawaan dokumentasi Supabase) sebelum migrasi 0001 dijalankan.
-- JANGAN dijalankan di database produksi.

create table public.profiles (
  id         uuid references auth.users not null primary key,
  updated_at timestamptz,
  username   text unique,
  full_name  text,
  avatar_url text,
  website    text
);

insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'lama@t.id', '{}');

insert into public.profiles (id, full_name)
values ('11111111-1111-1111-1111-111111111111', 'Akun Lama');

-- Setelah ini, jalankan 0001-0004. Harapan:
--   - selesai tanpa error
--   - kolom squad/faculty/phone/role/created_at bertambah
--   - kolom lama (username/avatar_url/website) dibiarkan
--   - baris "Akun Lama" tetap ada, role terisi 'member'
