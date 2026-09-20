-- Skenario policy terbuka yang pernah terjadi di produksi.
-- Dipakai untuk membuktikan kebocoran datanya nyata, lalu memastikan
-- migrasi 0004_repair_open_policies.sql menutupnya.
-- JANGAN dijalankan di database produksi.

-- SQL yang dijalankan user (dari sumber lain)
drop policy if exists "Enable insert for authenticated users" on public.profiles;
drop policy if exists "Enable read access for users" on public.profiles;
drop policy if exists "Enable update for users based on id" on public.profiles;

create policy "Allow public insertion during signup" on public.profiles for insert with check (true);
create policy "Allow users to read all profiles" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);
