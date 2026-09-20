import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { getLeaderboard } from "@/lib/gamification";
import { getProfile } from "@/lib/queries";
import { cn, initials } from "@/lib/utils";
import type { LeaderboardScope } from "@/lib/database.types";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

const SCOPES: { key: LeaderboardScope; label: string; caption: string }[] = [
  { key: "daily", label: "Hari Ini", caption: "XP yang dikumpulkan hari ini (WIB)." },
  { key: "weekly", label: "7 Hari", caption: "Akumulasi XP tujuh hari terakhir." },
  { key: "monthly", label: "30 Hari", caption: "Akumulasi XP tiga puluh hari terakhir." },
  { key: "all", label: "Sepanjang Program", caption: "Total XP sejak program dimulai." },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function isScope(value: string | undefined): value is LeaderboardScope {
  return value === "daily" || value === "weekly" || value === "monthly" || value === "all";
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { scope?: string };
}) {
  const scope: LeaderboardScope = isScope(searchParams.scope) ? searchParams.scope : "daily";
  const active = SCOPES.find((s) => s.key === scope)!;

  const [rows, profile] = await Promise.all([getLeaderboard(scope, 100), getProfile()]);
  const myRow = rows.find((row) => row.user_id === profile?.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-600">{active.caption}</p>
      </div>

      <nav aria-label="Rentang waktu" className="flex gap-1.5 overflow-x-auto pb-1">
        {SCOPES.map((item) => (
          <Link
            key={item.key}
            href={`/leaderboard?scope=${item.key}`}
            aria-current={item.key === scope ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition",
              item.key === scope
                ? "bg-brand-600 text-white shadow-sm"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {profile && !myRow && (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-center text-sm text-slate-600">
          Kamu belum masuk papan ini. Centang{" "}
          <Link href="/amalan" className="font-semibold text-brand-600">
            amalan yaumi
          </Link>{" "}
          hari ini untuk mulai mengumpulkan XP.
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-500">
            Belum ada XP tercatat pada rentang ini.
          </p>
        </Card>
      ) : (
        <ol className="space-y-2">
          {rows.map((row) => {
            const isMe = row.user_id === profile?.id;
            const medal = MEDALS[row.rank_position - 1];

            return (
              <li
                key={row.user_id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 shadow-sm transition",
                  isMe ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold",
                    row.rank_position <= 3 ? "bg-amber-50 text-lg" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {medal ?? row.rank_position}
                </span>

                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white"
                >
                  {initials(row.full_name)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {row.full_name}
                    {isMe && <span className="ml-1.5 text-xs font-bold text-brand-600">(kamu)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {row.squad ?? "Tanpa squad"} · Lv {row.level} {row.level_name}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {row.scoped_xp.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[11px] text-slate-400">XP</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-center text-xs text-slate-400">
        Papan ini hanya menampilkan nama, squad, dan XP. Isi laporan Maba Drama dan tracker
        mingguanmu tidak pernah ditampilkan ke peserta lain.
      </p>
    </div>
  );
}
