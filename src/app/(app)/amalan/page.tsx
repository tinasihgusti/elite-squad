import type { Metadata } from "next";

import { AmalChecklist } from "@/components/gamification/amal-checklist";
import { Card, CardHeader } from "@/components/ui/card";
import { getAmalItems, getMissionProgress, getToday, getTodayAmalKeys } from "@/lib/gamification";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Amalan Yaumi" };

// Ceklis harian harus selalu mencerminkan tanggal berjalan, bukan hasil cache.
export const dynamic = "force-dynamic";

export default async function AmalanPage() {
  const [items, checkedKeys, today, progress] = await Promise.all([
    getAmalItems(),
    getTodayAmalKeys(),
    getToday(),
    getMissionProgress(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Amalan Yaumi</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ceklis harian {formatDate(today)}. Indikator diambil dari modul pembinaan Elite Squad.
        </p>
      </div>

      {progress && progress.amal_streak_days > 1 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            🔥 Streak {progress.amal_streak_days} hari berturut-turut
          </p>
          <p className="text-xs text-amber-700">
            Jangan putus hari ini — konsistensi kecil yang dijaga lama mengalahkan ledakan semangat
            sesaat.
          </p>
        </div>
      )}

      <AmalChecklist items={items} checkedKeys={checkedKeys} today={formatDate(today)} />

      <Card>
        <CardHeader
          title="Kenapa ini dilacak harian?"
          description="Ringkasan dari Sesi 2 — Spiritual Fuel: Recharge Energi."
        />
        <p className="text-sm leading-relaxed text-slate-600">
          Modul menempatkan ritme ibadah sebagai bahan bakar utama asisten agar tidak burnout saat
          membersamai maba. Ceklis ini adalah versi digital dari <em>Habit Tracker Audit</em> pada
          sesi tersebut: bukan alat menghakimi, melainkan cara melihat pola — di hari seperti apa
          amalanmu paling mudah bocor, dan apa pemicunya.
        </p>
      </Card>
    </div>
  );
}
