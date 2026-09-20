# Elite Squad Tracker

Aplikasi web tracker mingguan untuk program mentoring **Elite Squad** — dirancang untuk ±200 pengguna aktif.

Stack: **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + Postgres)**.

---

## Fitur

| Modul | Isi |
| --- | --- |
| Autentikasi | Register, login, logout, verifikasi email, proteksi route via middleware |
| Dashboard | Ringkasan minggu terisi, kehadiran, rata-rata self-check, jumlah permintaan follow-up |
| Form Tracker Mingguan | Kehadiran & identitas · Mini Self-Check (5 dimensi skala 1–5 + 5 indikator kebiasaan) · "Maba Drama" · Feedback sesi mentoring |
| Rekap | Riwayat pengisian (tabel di desktop, kartu di mobile), tiap entri bisa diperbarui |
| Database | Tabel `profiles` & `weekly_trackers` + view rekap, semua diproteksi Row Level Security |

Form bersifat **upsert per (user, minggu)** — peserta bisa mengoreksi isiannya tanpa membuat entri ganda.

---

## Struktur Folder

```
src/
├── app/
│   ├── (auth)/              # login & register (layout terpisah, tanpa navbar)
│   ├── (app)/               # area terproteksi: dashboard, tracker, rekap
│   ├── auth/callback/       # route handler penukaran code → session
│   ├── layout.tsx           # root layout, font, metadata
│   ├── page.tsx             # landing page
│   └── error.tsx            # error boundary global
├── components/
│   ├── auth/                # LoginForm, RegisterForm
│   ├── layout/              # AppShell, NavLink
│   ├── tracker/             # TrackerForm, ScoreScale, CheckboxItem
│   └── ui/                  # Field, Alert, Card, SubmitButton
├── lib/
│   ├── actions/             # Server Actions (auth, tracker)
│   ├── supabase/            # client (browser), server, middleware
│   ├── validations/         # skema Zod
│   ├── database.types.ts    # tipe tabel Supabase
│   ├── env.ts               # validasi environment variable
│   ├── queries.ts           # query baca data
│   └── utils.ts             # helper tanggal & className
├── middleware.ts            # refresh session + proteksi route
└── supabase/migrations/     # skema SQL + RLS
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

Buka **SQL Editor** di dashboard Supabase, tempel seluruh isi
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), lalu **Run**.

Skrip itu membuat tabel, index, trigger auto-profile saat register, dan seluruh policy RLS.

### 4. Atur environment variable

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Ketiganya `NEXT_PUBLIC_*` dan aman dibagikan ke browser — akses data tetap dijaga RLS di sisi database, bukan oleh kerahasiaan anon key.

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

3. Perbarui *Site URL* dan *Redirect URLs* di Supabase sesuai domain Vercel.
4. **Deploy**.

`src/lib/env.ts` memvalidasi ketiga variabel saat build — kalau ada yang kosong atau salah format, build gagal dengan pesan yang jelas, bukan error misterius di runtime.

---

## Catatan Keamanan

- Session disimpan di **cookie httpOnly** (`@supabase/ssr`), bukan `localStorage`.
- **Row Level Security** aktif di semua tabel: peserta hanya bisa membaca/menulis barisnya sendiri; `mentor`/`admin` bisa membaca seluruh data lewat helper `public.is_staff()`.
- Parameter `next` pada login dan callback divalidasi agar hanya menerima path internal (cegah open redirect).
- Seluruh input divalidasi dua lapis: HTML + Zod di Server Action. Validasi client tidak dipercaya.

### Menjadikan akun sebagai mentor/admin

Jalankan di SQL Editor:

```sql
update public.profiles set role = 'mentor' where id = '<uuid-user>';
```

---

## Pengembangan Lanjutan

Beberapa arah yang sudah disiapkan strukturnya:

- **Panel mentor** — view `public.weekly_tracker_recap` sudah ada, tinggal dibuatkan halaman `/mentor` yang membacanya.
- **Export CSV** rekap per angkatan.
- **Reminder WhatsApp/email** untuk peserta yang belum mengisi di minggu berjalan.
- **Grafik tren** skor self-check per dimensi.
