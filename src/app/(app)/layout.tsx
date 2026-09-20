import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/lib/actions/auth";
import { getProfile } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  // JANGAN redirect ke /login di sini. User yang sampai ke titik ini sudah punya
  // sesi valid — middleware akan memantulkannya kembali ke /dashboard, dan
  // keduanya saling lempar sampai browser menyerah (ERR_TOO_MANY_REDIRECTS).
  // `getProfile()` sudah mencoba membuat profil yang hilang; kalau tetap gagal,
  // yang kurang adalah migrasi database, jadi katakan apa adanya.
  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="text-lg font-bold text-amber-900">Profil belum bisa dibuat</h1>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">
            Akunmu berhasil login, tapi datanya belum bisa disimpan. Biasanya ini berarti migrasi
            database di Supabase belum dijalankan sampai selesai.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/setup-check"
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Cek Status Instalasi
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-lg border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
