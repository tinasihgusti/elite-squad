import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    title: "Tracker Mingguan",
    body: "Satu form untuk kehadiran, self-check, kendala, dan feedback sesi. Bisa diisi ulang kalau ada koreksi.",
  },
  {
    title: "Mini Self-Check",
    body: "Skala 1–5 untuk lima dimensi pengembangan diri plus indikator kebiasaan harian.",
  },
  {
    title: "Maba Drama",
    body: "Ruang aman melaporkan kendala kuliah dan hidup, lengkap dengan rencana aksi dan permintaan follow-up mentor.",
  },
  {
    title: "Rekap Perkembangan",
    body: "Riwayat pengisian dan rata-rata skor per minggu, jadi progres terlihat, bukan sekadar terasa.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-16">
      <span className="w-fit rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
        Program Mentoring
      </span>

      <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
        Elite Squad Tracker
      </h1>
      <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
        Pantau konsistensi peserta mentoring dari minggu ke minggu — kehadiran, self-check,
        kendala, dan feedback sesi dalam satu tempat.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2"
        >
          Daftar Akun
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2"
        >
          Masuk
        </Link>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
