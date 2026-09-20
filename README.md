# Elite Squad Tracker

Aplikasi web tracker mingguan untuk program mentoring **Elite Squad** — dirancang untuk ±200 pengguna aktif.

Stack: **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + Postgres)**.

---

Seluruh isi materi, indikator, dan syarat kelulusan diambil dari
**Modul Pembinaan & Blueprint Program: Elite Squad (V2)** — bukan karangan aplikasi.

## Fitur

| Modul | Isi |
| --- | --- |
| Autentikasi | Register, login, logout, verifikasi email, proteksi route via middleware |
| Dashboard | Level & XP, streak amalan, peringkat harian, riwayat XP, pintasan aksi |
| **Amalan Yaumi** | Ceklis 9 indikator harian, **reset otomatis tiap hari (WIB)**, bisa di-undo kapan pun di hari yang sama |
| **Misi & Modul** | Kurikulum 10 pertemuan lengkap (fokus materi, indikator Juklak, metode sesi), centang → XP |
| **Maba Drama Box** | Laporan kendala + balasan "cheat code" dari mentor, XP dibatasi 1× per hari |
| **Leaderboard** | Peringkat harian / 7 hari / 30 hari / sepanjang program |
| **Panel Mentor** | Kelola peserta, tambah/kurangi XP dengan alasan tercatat, balas laporan drama, hapus akun peserta |
| Form Tracker Mingguan | Kehadiran & identitas · Mini Self-Check · "Maba Drama" · Feedback sesi mentoring |
| Rekap | Riwayat pengisian (tabel di desktop, kartu di mobile), tiap entri bisa diperbarui |

Form mingguan bersifat **upsert per (user, minggu)** — peserta bisa mengoreksi isiannya tanpa membuat entri ganda.

---

## Sistem XP & Level

XP disimpan sebagai **ledger** (`xp_events`), bukan satu kolom angka. Konsekuensinya:
setiap poin bisa ditelusuri asalnya, dicabut satu per satu, dan tidak pernah dobel.

| Sumber | XP | Catatan |
| --- | --- | --- |
| Amalan yaumi | 10–15 per item | Hilang lagi saat di-undo |
| Bonus amalan lengkap | +50 | Hangus otomatis kalau satu amalan dibatalkan |
| Sesi modul | +200 | Dicabut kalau mentor membatalkan kehadiran |
| Laporan Maba Drama | +40 | Maksimal **sekali per hari** |
| Tracker mingguan | +100 | Memperbarui isian tidak menambah XP lagi |
| Penyesuaian mentor | bebas (+/−) | Wajib disertai alasan, tercatat, bisa dibatalkan |

| Level | Nama | Min. XP | Fase modul |
| --- | --- | --- | --- |
| 1 | Rookie Assistant | 0 | Fase 2, Sesi 1–3 |
| 2 | Grounded Assistant | 300 | — |
| 3 | Resilient Assistant | 900 | Fase 3, Sesi 4–7 |
| 4 | Facilitator Assistant | 1.800 | Fase 4, Sesi 8–9 |
| 5 | **Elite Assistant** | 3.000 | Fase 5, Sesi 10 |

Badge **Elite Assistant** butuh dua syarat sekaligus: XP level 5 **dan** kehadiran
minimal 80% (8 dari 10 sesi) — mengikuti ketentuan kelulusan pada modul.

### Kenapa reset harian aman dari manipulasi

Tidak ada kolom "sudah dicentang". Tercentang = barisnya ada di `daily_amal_logs`
dengan `log_date` hari ini; undo = barisnya dihapus dan trigger database mencabut
XP-nya. Hari baru otomatis kosong karena tanggalnya berubah. RLS mengunci
`log_date = today_wib()`, jadi peserta **tidak bisa mengisi mundur** hari kemarin,
dan tidak bisa menulis atas nama orang lain.

---

## Struktur Folder

```
src/
├── app/
│   ├── (auth)/              # login & register (layout terpisah, tanpa navbar)
│   ├── (app)/               # area terproteksi
│   │   ├── dashboard/       # ringkasan XP, level, streak, peringkat
│   │   ├── amalan/          # ceklis amalan yaumi harian
│   │   ├── misi/            # kurikulum 10 pertemuan
│   │   ├── drama/           # Maba Drama Box
│   │   ├── leaderboard/     # papan peringkat
│   │   ├── admin/           # panel mentor (khusus mentor/admin)
│   │   ├── tracker/         # form tracker mingguan
│   │   └── rekap/           # riwayat pengisian
│   ├── auth/callback/       # route handler penukaran code → session
│   ├── layout.tsx           # root layout, font, metadata
│   ├── page.tsx             # landing page
│   └── error.tsx            # error boundary global
├── components/
│   ├── admin/               # ParticipantManager, DramaInbox, AdjustmentLog
│   ├── auth/                # LoginForm, RegisterForm
│   ├── drama/               # DramaForm, DramaList
│   ├── gamification/        # AmalChecklist, LevelCard, ModuleList
│   ├── layout/              # AppShell, NavLink
│   ├── tracker/             # TrackerForm, ScoreScale, CheckboxItem
│   └── ui/                  # Field, Alert, Card, SubmitButton
├── lib/
│   ├── actions/             # Server Actions (auth, tracker, gamification, admin)
│   ├── supabase/            # client (browser), server, middleware, admin
│   ├── validations/         # skema Zod
│   ├── admin.ts             # query panel mentor (server-only)
│   ├── database.types.ts    # tipe tabel Supabase
│   ├── env.ts               # validasi environment variable
│   ├── gamification.ts      # query XP, amalan, modul, leaderboard
│   ├── queries.ts           # query baca data
│   └── utils.ts             # helper tanggal & className
├── middleware.ts            # refresh session + proteksi route
└── supabase/
    ├── migrations/          # skema SQL + RLS
    └── tests/               # uji logika XP & RLS di Postgres lokal
```

---

## Setup Lokal

### 1. Install dependency

```bash
npm install
```

### 2. Buat project Supabase

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Setelah project jadi, masuk **Project Settings → API** dan salin:
   - `Project URL`
   - `anon public` key

### 3. Jalankan skema database

Buka **SQL Editor** di dashboard Supabase, lalu jalankan **berurutan**:

1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — profil, tracker mingguan, RLS dasar
2. [`supabase/migrations/0002_gamification.sql`](supabase/migrations/0002_gamification.sql) — XP, level, amalan yaumi, kurikulum 10 sesi, Maba Drama, leaderboard, panel mentor

Kedua skrip idempoten (aman dijalankan ulang) dan sudah berisi seluruh data
referensi: 5 level, 9 amalan yaumi, dan 10 sesi modul lengkap dengan indikator Juklak.

### 4. Atur environment variable

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Opsional — hanya untuk fitur "hapus akun peserta" di panel mentor
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

> Tiga variabel `NEXT_PUBLIC_*` aman dibagikan ke browser — akses data dijaga RLS di sisi database, bukan oleh kerahasiaan anon key.
>
> **`SUPABASE_SERVICE_ROLE_KEY` berbeda.** Key ini melewati seluruh RLS dan setara akses root ke database. Ambil dari *Project Settings → API → service_role*, simpan **hanya** di server (tanpa awalan `NEXT_PUBLIC_`), dan jangan pernah di-commit. Tanpa key ini aplikasi tetap berjalan normal — hanya tombol hapus akun yang nonaktif, dan panel mentor menampilkan keterangannya.

### 5. Atur URL redirect Auth

**Authentication → URL Configuration**:

- *Site URL*: `http://localhost:3000` (ganti ke domain Vercel saat production)
- *Redirect URLs*: tambahkan `http://localhost:3000/auth/callback` dan `https://<project>.vercel.app/auth/callback`

### 6. Jalankan

```bash
npm run dev       # http://localhost:3000
npm run typecheck # cek tipe
npm run lint      # cek lint
npm run build     # build produksi
```

---

## Deploy ke Vercel

1. Push repo ini ke GitHub, lalu **Import Project** di Vercel (preset Next.js terdeteksi otomatis).
2. Di **Settings → Environment Variables**, isi untuk environment *Production* **dan** *Preview*:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `NEXT_PUBLIC_SITE_URL` | `https://<project>.vercel.app` |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key — opsional, **jangan** beri awalan `NEXT_PUBLIC_` |

3. Perbarui *Site URL* dan *Redirect URLs* di Supabase sesuai domain Vercel.
4. **Deploy**.

`src/lib/env.ts` memvalidasi ketiga variabel saat build — kalau ada yang kosong atau salah format, build gagal dengan pesan yang jelas, bukan error misterius di runtime.

---

## Catatan Keamanan

- Session disimpan di **cookie httpOnly** (`@supabase/ssr`), bukan `localStorage`.
- **Row Level Security** aktif di semua tabel: peserta hanya bisa membaca/menulis barisnya sendiri; `mentor`/`admin` bisa membaca seluruh data lewat helper `public.is_staff()`.
- Parameter `next` pada login dan callback divalidasi agar hanya menerima path internal (cegah open redirect).
- Seluruh input divalidasi dua lapis: HTML + Zod di Server Action. Validasi client tidak dipercaya.
- **XP tidak bisa dikarang dari browser.** Peserta hanya punya izin `SELECT` pada `xp_events`; seluruh penambahan poin terjadi lewat trigger `SECURITY DEFINER` di database.
- Kolom `role` dikunci trigger — peserta tidak bisa mengangkat dirinya sendiri jadi admin lewat request `UPDATE` ke tabel `profiles`.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di `src/lib/supabase/admin.ts` yang ditandai `server-only`, sehingga build gagal kalau file itu sampai ter-import dari Client Component. Setiap action yang memakainya memverifikasi peran mentor/admin lebih dulu.
- Leaderboard memakai fungsi `SECURITY DEFINER` yang hanya mengembalikan nama, squad, dan XP. Email, nomor WhatsApp, dan isi laporan Maba Drama tidak pernah terekspos ke peserta lain.

### Uji otomatis skema

Logika XP dan seluruh aturan RLS bisa diverifikasi di PostgreSQL lokal tanpa
menyentuh project produksi — lihat [`supabase/tests/README.md`](supabase/tests/README.md).

### Menjadikan akun sebagai mentor/admin

Jalankan di SQL Editor:

```sql
update public.profiles set role = 'mentor' where id = '<uuid-user>';
```

---

## Pengembangan Lanjutan

Beberapa arah yang sudah disiapkan strukturnya:

- **Export CSV** rekap per squad/fakultas untuk laporan ke Pokja.
- **Reminder WhatsApp** otomatis untuk peserta yang belum mengisi amalan atau tracker.
- **Grafik tren** skor self-check dan perolehan XP per dimensi.
- **Leaderboard per squad**, supaya kompetisinya antar kelompok, bukan antar individu.
- **Badge tambahan** per fase roadmap (Fase 2–5), bukan hanya badge kelulusan.
