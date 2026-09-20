import Link from "next/link";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import type { SetupStatusRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Cek Instalasi" };
export const dynamic = "force-dynamic";

/**
 * Halaman diagnostik: memastikan ketiga migrasi SQL sudah terpasang.
 * Sengaja publik dan sengaja tidak menampilkan data apa pun — hanya status
 * ada/tidak ada per komponen, supaya aman dibuka siapa saja.
 */
export default async function SetupCheckPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("setup_status");

  const rows = (data as unknown as SetupStatusRow[] | null) ?? [];
  const allReady = rows.length > 0 && rows.every((row) => row.ready);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Cek Instalasi</h1>
      <p className="mt-1 text-sm text-slate-600">
        Memastikan skema database Supabase sudah terpasang lengkap.
      </p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-bold text-red-900">Belum bisa membaca status</h2>
          <p className="mt-2 text-sm text-red-800">
            Aplikasi tidak menemukan fungsi <code>setup_status()</code>. Artinya migrasi SQL belum
            dijalankan sama sekali, atau baru sebagian.
          </p>
          <p className="mt-3 break-words font-mono text-[11px] text-red-700 opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <>
          <div
            className={`mt-6 rounded-xl border p-4 ${
              allReady ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
            }`}
          >
            <p
              className={`text-sm font-bold ${allReady ? "text-emerald-900" : "text-amber-900"}`}
            >
              {allReady
                ? "Semua komponen terpasang. Aplikasi siap dipakai."
                : "Ada komponen yang belum terpasang — lihat daftar di bawah."}
            </p>
          </div>

          <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {rows.map((row) => (
              <li key={row.item} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{row.item}</p>
                  <p className="text-xs text-slate-500">{row.detail}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    row.ready ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {row.ready ? "Siap" : "Belum"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Cara memperbaiki</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          <li>Buka dashboard Supabase → <strong>SQL Editor</strong>.</li>
          <li>
            Jalankan berurutan isi file <code>supabase/migrations/0001_init.sql</code>,{" "}
            <code>0002_gamification.sql</code>, lalu <code>0003_signup_hardening.sql</code>.
          </li>
          <li>Muat ulang halaman ini — semua baris harus berstatus &ldquo;Siap&rdquo;.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Ketiga skrip aman dijalankan berulang kali, jadi tidak masalah kalau sebagian sudah
          pernah dijalankan.
        </p>
      </section>

      <div className="mt-6 flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Coba Daftar
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Ke Login
        </Link>
      </div>
    </main>
  );
}
