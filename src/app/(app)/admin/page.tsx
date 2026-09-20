import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AdjustmentLog } from "@/components/admin/adjustment-log";
import { DramaInbox } from "@/components/admin/drama-inbox";
import { ParticipantManager } from "@/components/admin/participant-manager";
import { Card, CardHeader } from "@/components/ui/card";
import {
  getAllDramaReports,
  getParticipants,
  getRecentAdjustments,
  getStaffProfile,
} from "@/lib/admin";
import { isAdminDeleteEnabled } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Panel Mentor" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const staff = await getStaffProfile();

  // Middleware hanya menjaga "sudah login". Otorisasi peran diperiksa di sini,
  // dan sekali lagi di setiap Server Action — halaman bukan satu-satunya gerbang.
  if (!staff) redirect("/dashboard");

  const [participants, dramaReports, adjustments] = await Promise.all([
    getParticipants(),
    getAllDramaReports(),
    getRecentAdjustments(),
  ]);

  const members = participants.filter((p) => p.role === "member");
  const pendingDrama = dramaReports.filter((r) => !r.mentor_reply).length;
  const activeToday = participants.filter((p) => p.today_xp > 0).length;
  const atRisk = members.filter((p) => p.sessions_done < 3 && p.total_xp < 300).length;

  const stats = [
    { label: "Total peserta", value: members.length },
    { label: "Aktif hari ini", value: activeToday },
    { label: "Drama belum dibalas", value: pendingDrama },
    { label: "Perlu intervensi", value: atRisk },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Panel Mentor</h1>
        <p className="mt-1 text-sm text-slate-600">
          Masuk sebagai {staff.full_name} ({staff.role}).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {atRisk > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            {atRisk} peserta terindikasi mulai drop
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Modul menyarankan <em>personal touch</em>: japri personal penuh empati, bukan menegur di
            grup besar. Bisa juga diganti mentoring asinkron lewat voice note.
          </p>
        </div>
      )}

      <Card>
        <CardHeader
          title="Kelola Peserta"
          description="Klik satu baris untuk melihat detail, menyesuaikan XP, atau menghapus akun."
        />
        <ParticipantManager participants={participants} deleteEnabled={isAdminDeleteEnabled()} />
      </Card>

      <Card>
        <CardHeader
          title="Inbox Maba Drama"
          description="Balas dengan solusi praktis yang bisa langsung dieksekusi peserta."
        />
        <DramaInbox reports={dramaReports} />
      </Card>

      <Card>
        <CardHeader
          title="Riwayat Penyesuaian XP"
          description="Setiap penambahan dan pengurangan XP tercatat lengkap dan bisa dibatalkan."
        />
        <AdjustmentLog adjustments={adjustments} participants={participants} />
      </Card>
    </div>
  );
}
