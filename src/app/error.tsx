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
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Ada yang bermasalah</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Terjadi kesalahan tak terduga saat memuat halaman. Coba muat ulang; kalau masih berlanjut,
        hubungi admin Elite Squad.
      </p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Kode error: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Coba Lagi
      </button>
    </main>
  );
}
