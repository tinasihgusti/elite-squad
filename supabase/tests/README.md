# Uji Skema (PostgreSQL lokal)

Skrip ini memverifikasi logika XP, undo amalan, anti-dobel poin, dan Row Level
Security tanpa perlu menyentuh project Supabase produksi.

## Menjalankan

```bash
export PGDATA=/tmp/pgdata PGPORT=55432
initdb -D $PGDATA -A trust -U postgres
pg_ctl -D $PGDATA -o "-p $PGPORT" -l /tmp/pg.log start

createdb -h localhost -p $PGPORT -U postgres elite
psql -h localhost -p $PGPORT -U postgres -d elite -v ON_ERROR_STOP=1 \
  -f supabase/tests/00_stub_supabase.sql \
  -f supabase/migrations/0001_init.sql \
  -f supabase/migrations/0002_gamification.sql \
  -f supabase/tests/01_xp_amalan.sql \
  -f supabase/tests/02_modul_drama_leaderboard.sql \
  -f supabase/tests/03_rls.sql
```

`00_stub_supabase.sql` meniru bagian Supabase yang tidak ada di Postgres polos:
skema `auth`, tabel `auth.users`, fungsi `auth.uid()`, dan role `authenticated`.
Tabel `public._test_ctx` dipakai untuk memalsukan user yang sedang login —
**jangan pernah dijalankan di database produksi.**

## Yang diverifikasi

`01` — XP bertambah saat amalan dicentang, berkurang tepat saat di-undo, tidak
dobel saat dicentang ulang, dan bonus harian ikut hangus saat satu amalan dibatalkan.

`02` — XP modul dicabut saat mentor membatalkan kehadiran, laporan Maba Drama
dibatasi satu kali XP per hari, pembaruan tracker mingguan tidak menambah XP,
penyesuaian XP negatif oleh mentor, leaderboard, dan `mission_progress`.

`03` — peserta tidak bisa menyuntik XP, mengisi amalan mundur, menulis atas nama
orang lain, mengangkat dirinya jadi admin, membaca laporan peserta lain, atau
memalsukan balasan mentor.

`04` — memverifikasi bahwa policy `profiles` yang terlalu terbuka benar-benar
membocorkan data (anonim bisa membaca seluruh nama dan nomor WhatsApp, dan
peserta tanpa profil bisa mengangkat dirinya jadi admin lalu membaca laporan
Maba Drama orang lain), lalu membuktikan migrasi 0004 menutup keduanya tanpa
merusak pendaftaran normal maupun pengangkatan mentor.
