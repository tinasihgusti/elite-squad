import Link from "next/link";
import type { Metadata } from "next";

import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { averageScore, getMyTrackers, getProfile, habitCount } from "@/lib/queries";
import { formatDate, isoWeekNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const ATTENDANCE_LABEL: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Tanpa keterangan",
};

const ATTENDANCE_STYLE: Record<string, string> = {
  hadir: "bg-emerald-50 text-emerald-700",
  izin: "bg-amber-50 text-amber-700",
  sakit: "bg-sky-50 text-sky-700",
  alpa: "bg-red-50 text-red-700",
};

export default async function DashboardPage() {
  const [profile, trackers] = await Promise.all([getProfile(), getMyTrackers()]);

  const currentWeek = isoWeekNumber();
  const thisWeek = trackers.find((t) => t.week_number === currentWeek);
  const attendedCount = trackers.filter((t) => t.attendance === "hadir").length;
  const avgAll = trackers.length
    ? Number((trackers.reduce((sum, t) => sum + averageScore(t), 0) / trackers.length).toFixed(2))
    : 0;
  const openFollowups = trackers.filter((t) => t.needs_followup).length;

  const stats = [
    { label: "Minggu terisi", value: trackers.length },
    { label: "Kehadiran", value: attendedCount },
    { label: "Rata-rata self-check", value: trackers.length ? avgAll.toFixed(2) : "—" },
    { label: "Minta follow-up", value: openFollowups },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Halo, {profile?.full_name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Ini ringkasan perjalanan mentoring kamu sejauh ini.
        </p>
      </div>

      {thisWeek ? (
        <Alert variant="success">
          Tracker <strong>Minggu {currentWeek}</strong> sudah kamu isi pada{" "}
          {formatDate(thisWeek.created_at)}.{" "}
          <Link href={`/tracker?week=${currentWeek}`} className="font-semibold underline">
            Perbarui isian
          </Link>
        </Alert>
      ) : (
        <Alert variant="info">
          Tracker <strong>Minggu {currentWeek}</strong> belum diisi.{" "}
          <Link href="/tracker" className="font-semibold underline">
            Isi sekarang
          </Link>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Pengisian terakhir"
          description="Lima entri terbaru dari tracker mingguanmu."
          action={
            <Link
              href="/rekap"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Lihat semua
            </Link>
          }
        />

        {trackers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">Belum ada data tracker</p>
            <p className="mt-1 text-sm text-slate-500">
              Mulai dari minggu ini — pengisian pertama butuh sekitar 3 menit.
            </p>
            <Link
              href="/tracker"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Isi Tracker Mingguan
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {trackers.slice(0, 5).map((tracker) => (
              <li key={tracker.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Minggu {tracker.week_number}
                    <span className="ml-2 font-normal text-slate-500">
                      {formatDate(tracker.week_start_date)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Rata-rata {averageScore(tracker)} · {habitCount(tracker)}/5 kebiasaan
                    {tracker.needs_followup && " · minta follow-up"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ATTENDANCE_STYLE[tracker.attendance]}`}
                >
                  {ATTENDANCE_LABEL[tracker.attendance]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
