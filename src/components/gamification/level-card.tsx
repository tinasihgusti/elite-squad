import { levelProgress } from "@/lib/gamification";
import type { LevelRow, MissionProgressRow } from "@/lib/database.types";

export function LevelCard({
  progress,
  levels,
  name,
}: {
  progress: MissionProgressRow;
  levels: LevelRow[];
  name: string;
}) {
  const percent = levelProgress(progress, levels);
  const current = levels.find((l) => l.level === progress.level);
  const isMax = progress.next_level_min_xp === null;

  return (
    <section className="rounded-xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            Level {progress.level} · {name.split(" ")[0]}
          </p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">{progress.level_name}</h2>
          {current && <p className="mt-1 max-w-md text-xs text-white/80">{current.description}</p>}
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold leading-none">{progress.total_xp.toLocaleString("id-ID")}</p>
          <p className="text-xs text-white/70">total XP</p>
          {progress.today_xp > 0 && (
            <p className="mt-1 text-xs font-semibold text-emerald-200">
              +{progress.today_xp} hari ini
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-white/80">
          <span>{isMax ? "Level maksimal tercapai" : `Menuju ${nextLevelName(levels, progress)}`}</span>
          <span>
            {isMax
              ? "Elite Assistant"
              : `${progress.total_xp.toLocaleString("id-ID")} / ${progress.next_level_min_xp?.toLocaleString("id-ID")} XP`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres menuju level berikutnya"
          className="h-2.5 w-full overflow-hidden rounded-full bg-white/25"
        >
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {progress.graduated && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
          🏅 Badge Elite Assistant diraih
        </p>
      )}
    </section>
  );
}

function nextLevelName(levels: LevelRow[], progress: MissionProgressRow): string {
  return levels.find((l) => l.level === progress.level + 1)?.name ?? "level berikutnya";
}
