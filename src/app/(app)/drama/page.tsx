import type { Metadata } from "next";

import { DramaForm } from "@/components/drama/drama-form";
import { DramaList } from "@/components/drama/drama-list";
import { getMyDramaReports, getToday } from "@/lib/gamification";

export const metadata: Metadata = { title: "Maba Drama Box" };
export const dynamic = "force-dynamic";

export default async function DramaPage() {
  const [reports, today] = await Promise.all([getMyDramaReports(), getToday()]);
  const alreadyEarnedToday = reports.some((r) => r.reported_on === today);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Maba Drama Box</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ruang problem-solving. Laporanmu hanya dibaca kamu dan tim mentor — tidak muncul di
          leaderboard atau terlihat peserta lain.
        </p>
      </div>

      <DramaForm alreadyEarnedToday={alreadyEarnedToday} />

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Laporanmu ({reports.length})
        </h2>
        <DramaList reports={reports} />
      </div>
    </div>
  );
}
