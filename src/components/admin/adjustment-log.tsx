"use client";

import { useState, useTransition } from "react";

import { revertAdjustmentAction } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import type { AdminParticipantRow, XpEventRow } from "@/lib/database.types";

export function AdjustmentLog({
  adjustments,
  participants,
}: {
  adjustments: XpEventRow[];
  participants: AdminParticipantRow[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const nameOf = (userId: string) =>
    participants.find((p) => p.user_id === userId)?.full_name ?? "Peserta";

  function revert(id: string) {
    if (!confirm("Batalkan penyesuaian XP ini? XP peserta akan kembali seperti semula.")) return;

    setPendingId(id);
    setError(null);

    startTransition(async () => {
      const result = await revertAdjustmentAction(id);
      setPendingId(null);
      if (result.status === "error") setError(result.message);
    });
  }

  if (adjustments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
        Belum ada penyesuaian XP.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}

      <ul className="divide-y divide-slate-100">
        {adjustments.map((adjustment) => (
          <li key={adjustment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {nameOf(adjustment.user_id)}{" "}
                <span
                  className={`font-bold ${
                    adjustment.points < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {adjustment.points > 0 ? "+" : ""}
                  {adjustment.points} XP
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {adjustment.note} · {formatDate(adjustment.created_at)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => revert(adjustment.id)}
              disabled={pendingId === adjustment.id}
              className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {pendingId === adjustment.id ? "Membatalkan..." : "Batalkan"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
