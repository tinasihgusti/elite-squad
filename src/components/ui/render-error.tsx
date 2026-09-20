/**
 * Panel error untuk kegagalan saat render di server.
 *
 * Next.js menyembunyikan pesan error produksi dari browser dan hanya
 * menyisakan digest (di klien muncul sebagai "Minified React error #441").
 * Dengan menangkap sendiri errornya lalu merendernya lewat komponen ini,
 * pesan aslinya tetap sampai ke layar tanpa perlu membuka log server.
 */
export function RenderError({ where, error }: { where: string; error: unknown }) {
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <h2 className="text-sm font-bold text-red-900">Gagal memuat {where}</h2>
      <p className="mt-2 text-sm text-red-800">
        Bagian ini gagal dimuat dari server. Rincian teknisnya di bawah — kirimkan ke admin kalau
        terus berulang.
      </p>
      <p className="mt-3 break-words font-mono text-[11px] leading-relaxed text-red-700">
        {detail.slice(0, 800)}
      </p>
    </div>
  );
}
