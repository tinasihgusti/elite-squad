import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { TrackerForm } from "@/components/tracker/tracker-form";
import { Alert } from "@/components/ui/alert";
import { RenderError } from "@/components/ui/render-error";
import { getProfile, getTrackerByWeek } from "@/lib/queries";
import { isoWeekNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Isi Tracker" };

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;

  let profile;
  try {
    profile = await getProfile();
  } catch (error) {
    return <RenderError where="data tracker" error={error} />;
  }
  if (!profile) redirect("/login");

  const parsedWeek = Number(weekParam);
  const week =
    Number.isInteger(parsedWeek) && parsedWeek >= 1 && parsedWeek <= 52
      ? parsedWeek
      : isoWeekNumber();

  let existing;
  try {
    existing = await getTrackerByWeek(week);
  } catch (error) {
    return <RenderError where="isian tracker minggu ini" error={error} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Tracker Mingguan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Minggu ke-{week}. Isi jujur — datanya untuk refleksimu sendiri dan bahan mentor.
        </p>
      </div>

      {existing && (
        <Alert variant="info">
          Kamu sudah mengisi tracker minggu ini. Form di bawah berisi jawaban terakhirmu —
          menyimpan lagi akan memperbaruinya, bukan membuat entri baru.
        </Alert>
      )}

      <TrackerForm profile={profile} existing={existing} defaultWeek={week} />
    </div>
  );
}
