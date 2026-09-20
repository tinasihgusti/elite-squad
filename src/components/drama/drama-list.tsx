"use client";

import { useState, useTransition } from "react";

import { deleteDramaAction } from "@/lib/actions/gamification";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import type { DramaReportRow } from "@/lib/database.types";

export function DramaList({ reports }: { reports: DramaReportRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(report: DramaReportRow) {
    if (!confirm(`Hapus laporan "${report.title}"?`)) return;

    setDeletingId(report.id);
    setError(null);

    startTransition(async () => {
      const result = await deleteDramaAction(report.id);
      setDeletingId(null);
      if (result.status === "error") setError(result.message);
    });
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
        <p className="text-sm font-medium text-slate-700">Belum ada laporan</p>
        <p className="mt-1 text-sm text-slate-500">
          Kendala sekecil apa pun layak ditulis — mentor ada untuk itu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}

      {reports.map((report) => (
        <article key={report.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {report.category}
                </span>
                {report.is_urgent && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Prioritas
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    report.mentor_reply
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {report.mentor_reply ? "Sudah dibalas" : "Menunggu mentor"}
                </span>
              </div>
              <h3 className="mt-1.5 text-sm font-bold text-slate-900">{report.title}</h3>
              <p className="text-xs text-slate-500">{formatDate(report.created_at)}</p>
            </div>

            {!report.mentor_reply && (
              <button
                type="button"
                onClick={() => remove(report)}
                disabled={deletingId === report.id}
                className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {deletingId === report.id ? "Menghapus..." : "Hapus"}
              </button>
            )}
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {report.story}
          </p>

          {report.mentor_reply && (
            <div className="mt-4 rounded-lg border-l-4 border-emerald-400 bg-emerald-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Cheat code dari mentor
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
                {report.mentor_reply}
              </p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
