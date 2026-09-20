import type { Metadata } from "next";

import { LevelCard } from "@/components/gamification/level-card";
import { ModuleList } from "@/components/gamification/module-list";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { RenderError } from "@/components/ui/render-error";
import {
  getLevels,
  getMissionProgress,
  getModuleSessions,
  getMyModuleCompletions,
} from "@/lib/gamification";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Misi & Modul" };
export const dynamic = "force-dynamic";

export default async function MisiPage() {
  let profile, progress, levels, sessions, completions;
  try {
    [profile, progress, levels, sessions, completions] = await Promise.all([
      getProfile(),
      getMissionProgress(),
      getLevels(),
      getModuleSessions(),
      getMyModuleCompletions(),
    ]);
  } catch (error) {
    return <RenderError where="data misi & modul" error={error} />;
  }

  const minAttendance = Math.ceil(sessions.length * 0.8);
  const sessionsLeft = Math.max(0, minAttendance - (progress?.sessions_done ?? 0));
  const xpToElite = levels.find((l) => l.level === 5)?.min_xp ?? 0;
  const xpLeft = Math.max(0, xpToElite - (progress?.total_xp ?? 0));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Misi & Modul</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kurikulum 10 pertemuan Elite Squad. Centang sesi yang sudah kamu ikuti.
        </p>
      </div>

      {progress && profile && (
        <LevelCard progress={progress} levels={levels} name={profile.full_name} />
      )}

      <Card>
        <CardHeader
          title="Syarat Badge Elite Assistant"
          description="Mengikuti ketentuan kelulusan pada modul: kehadiran minimal 80%."
        />

        {progress?.graduated ? (
          <Alert variant="success">
            Semua syarat kelulusan terpenuhi. Badge Elite Assistant sudah jadi milikmu — sampai
            jumpa di Appreciation Night (Sesi 10).
          </Alert>
        ) : (
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span aria-hidden>{sessionsLeft === 0 ? "✅" : "⬜"}</span>
              <span className="text-slate-700">
                Hadir minimal <strong>{minAttendance} dari {sessions.length} sesi</strong> — sudah{" "}
                {progress?.sessions_done ?? 0}
                {sessionsLeft > 0 && `, kurang ${sessionsLeft} sesi lagi`}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>{xpLeft === 0 ? "✅" : "⬜"}</span>
              <span className="text-slate-700">
                Kumpulkan <strong>{xpToElite.toLocaleString("id-ID")} XP</strong> — sudah{" "}
                {(progress?.total_xp ?? 0).toLocaleString("id-ID")}
                {xpLeft > 0 && `, kurang ${xpLeft.toLocaleString("id-ID")} XP lagi`}
              </span>
            </li>
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Kurikulum 10 Pertemuan</h2>
        <ModuleList sessions={sessions} completions={completions} />
      </div>

      <p className="text-center text-xs text-slate-400">
        Centang mandiri langsung menambah XP, tapi mentor memverifikasi ulang lewat panel. Data yang
        tidak sesuai akan dicabut beserta XP-nya.
      </p>
    </div>
  );
}
