"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Ada yang bermasalah</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Terjadi kesalahan tak terduga saat memuat halaman. Coba muat ulang; kalau masih berlanjut,
        hubungi admin Elite Squad.
      </p>

      {/*
        Next.js menyembunyikan pesan error dari browser di mode produksi dan
        hanya menyisakan digest. Pesan lengkapnya ada di log runtime Vercel,
        dan digest inilah kunci untuk menemukannya.
      */}
      {error.digest && (
        <div className="mt-4 w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 p-3 text-left">
          <p className="text-xs font-semibold text-slate-700">Kode error</p>
          <p className="mt-0.5 break-all font-mono text-xs text-slate-900">{error.digest}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Untuk admin: buka Vercel → project → <strong>Logs</strong>, cari kode di atas. Baris
            yang cocok memuat pesan error lengkapnya.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Coba Lagi
        </button>
        <a
          href="/setup-check"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cek Instalasi
        </a>
      </div>
    </main>
  );
}
