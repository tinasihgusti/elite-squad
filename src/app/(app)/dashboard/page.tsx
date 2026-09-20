import Link from "next/link";
import type { Metadata } from "next";

import { LevelCard } from "@/components/gamification/level-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { RenderError } from "@/components/ui/render-error";
import {
  XP_SOURCE_LABEL,
  getAmalItems,
  getLeaderboard,
  getLevels,
  getMissionProgress,
  getMyXpHistory,
  getToday,
  getTodayAmalKeys,
} from "@/lib/gamification";
import { getMyTrackers, getProfile } from "@/lib/queries";
import { formatDate, isoWeekNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/amalan", label: "Amalan Yaumi", caption: "Ceklis harian", emoji: "🌙" },
  { href: "/misi", label: "Misi & Modul", caption: "10 pertemuan", emoji: "🎯" },
  { href: "/drama", label: "Maba Drama", caption: "Lapor kendala", emoji: "💬" },
  { href: "/leaderboard", label: "Leaderboard", caption: "Papan peringkat", emoji: "🏆" },
];

export default async function DashboardPage() {
  let profile, progress, levels, amalItems, amalToday, today, trackers, xpHistory, daily;
  try {
    [profile, progress, levels, amalItems, amalToday, today, trackers, xpHistory, daily] =
      await Promise.all([
        getProfile(),
        getMissionProgress(),
        getLevels(),
        getAmalItems(),
        getTodayAmalKeys(),
        getToday(),
        getMyTrackers(),
        getMyXpHistory(8),
        getLeaderboard("daily", 100),
      ]);
  } catch (error) {
    return <RenderError where="data dashboard" error={error} />;
  }

  const currentWeek = isoWeekNumber();
  const thisWeek = trackers.find((t) => t.week_number === currentWeek);
  const myRank = daily.find((row) => row.user_id === profile?.id);
  const amalLeft = amalItems.length - amalToday.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Halo, {profile?.full_name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-600">{formatDate(today)}</p>
      </div>

      {progress && profile && (
        <LevelCard progress={progress} levels={levels} name={profile.full_name} />
      )}

      {amalLeft > 0 ? (
        <Alert variant="info">
          Masih ada <strong>{amalLeft} amalan</strong> yang belum kamu centang hari ini.{" "}
          <Link href="/amalan" className="font-semibold underline">
            Buka ceklis
          </Link>
        </Alert>
      ) : (
        <Alert variant="success">
          Amalan yaumi hari ini lengkap. Bonus +50 XP masuk — pertahankan streak-nya. 🔥
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span aria-hidden className="text-2xl">
              {action.emoji}
            </span>
            <p className="mt-2 text-sm font-semibold text-slate-900">{action.label}</p>
            <p className="text-xs text-slate-500">{action.caption}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox
          label="Peringkat hari ini"
          value={myRank ? `#${myRank.rank_position}` : "—"}
          caption={myRank ? `dari ${daily.length} peserta aktif` : "Belum ada XP hari ini"}
        />
        <StatBox
          label="Streak amalan"
          value={progress ? `${progress.amal_streak_days} hari` : "0 hari"}
          caption="Berturut-turut tanpa putus"
        />
        <StatBox
          label="Sesi modul"
          value={progress ? `${progress.sessions_done}/${progress.sessions_total}` : "0/10"}
          caption={`Kehadiran ${progress?.attendance_percent ?? 0}%`}
        />
      </div>

      {!thisWeek && (
        <Alert variant="info">
          Tracker <strong>Minggu {currentWeek}</strong> belum diisi (+100 XP).{" "}
          <Link href="/tracker" className="font-semibold underline">
            Isi sekarang
          </Link>
        </Alert>
      )}

      <Card>
        <CardHeader
          title="XP terakhir masuk"
          description="Riwayat delapan perolehan XP terbaru."
          action={
            <Link href="/leaderboard" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Leaderboard
            </Link>
          }
        />

        {xpHistory.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Belum ada XP. Mulai dari ceklis amalan yaumi hari ini.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {xpHistory.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {event.note ?? XP_SOURCE_LABEL[event.source] ?? event.source}
                  </p>
                  <p className="text-xs text-slate-500">
                    {XP_SOURCE_LABEL[event.source] ?? event.source} · {formatDate(event.occurred_on)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold ${
                    event.points < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {event.points > 0 ? "+" : ""}
                  {event.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{caption}</p>
    </div>
  );
}
