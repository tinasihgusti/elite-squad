import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verifikasi Gagal" };

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Link verifikasi tidak valid</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Link ini sudah kedaluwarsa atau sudah pernah dipakai. Coba login — kalau masih gagal,
        daftar ulang untuk mendapat link verifikasi baru.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Ke Login
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Daftar Ulang
        </Link>
      </div>
    </main>
  );
}
