import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { RenderError } from "@/components/ui/render-error";
import { averageScore, getMyTrackers, habitCount } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Rekap" };

const ATTENDANCE_LABEL: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

export default async function RekapPage() {
  let trackers;
  try {
    trackers = await getMyTrackers();
  } catch (error) {
    return <RenderError where="rekap tracker" error={error} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Rekap Tracker</h1>
        <p className="mt-1 text-sm text-slate-600">
          Seluruh riwayat pengisianmu, dari minggu terbaru.
        </p>
      </div>

      {trackers.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-slate-700">Belum ada rekap</p>
            <p className="mt-1 text-sm text-slate-500">
              Rekap muncul setelah kamu mengisi tracker minimal satu kali.
            </p>
            <Link
              href="/tracker"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Isi Tracker
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Tabel untuk layar lebar */}
          <Card className="hidden p-0 sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Minggu</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Tanggal</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Kehadiran</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Rata-rata</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Kebiasaan</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Follow-up</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trackers.map((tracker) => (
                    <tr key={tracker.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        Minggu {tracker.week_number}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(tracker.week_start_date)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {ATTENDANCE_LABEL[tracker.attendance]}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {averageScore(tracker)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{habitCount(tracker)}/5</td>
                      <td className="px-4 py-3 text-slate-600">
                        {tracker.needs_followup ? "Ya" : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/tracker?week=${tracker.week_number}`}
                          className="font-semibold text-brand-600 hover:text-brand-700"
                        >
                          Ubah
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Kartu untuk mobile */}
          <div className="space-y-3 sm:hidden">
            {trackers.map((tracker) => (
              <Card key={tracker.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">Minggu {tracker.week_number}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(tracker.week_start_date)} · {ATTENDANCE_LABEL[tracker.attendance]}
                    </p>
                  </div>
                  <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-bold text-brand-700">
                    {averageScore(tracker)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  Kebiasaan {habitCount(tracker)}/5
                  {tracker.drama_category && ` · ${tracker.drama_category}`}
                  {tracker.needs_followup && " · minta follow-up"}
                </p>
                <Link
                  href={`/tracker?week=${tracker.week_number}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand-600"
                >
                  Ubah isian
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
