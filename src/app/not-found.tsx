import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Alamat yang kamu buka tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Kembali ke Dashboard
      </Link>
    </main>
  );
}
