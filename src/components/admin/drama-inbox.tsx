"use client";

import { useState, useActionState } from "react";

import { replyDramaAction } from "@/lib/actions/admin";
import { idleState } from "@/lib/actions/types";
import { Alert } from "@/components/ui/alert";
import { inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn, formatDate } from "@/lib/utils";
import type { DramaWithAuthor } from "@/lib/admin";

export function DramaInbox({ reports }: { reports: DramaWithAuthor[] }) {
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const visible = filter === "pending" ? reports.filter((r) => !r.mentor_reply) : reports;
  const pendingCount = reports.filter((r) => !r.mentor_reply).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {(
          [
            { key: "pending", label: `Belum dibalas (${pendingCount})` },
            { key: "all", label: `Semua (${reports.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            aria-pressed={filter === tab.key}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition",
              filter === tab.key
                ? "bg-brand-600 text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          {filter === "pending" ? "Semua laporan sudah dibalas. 👏" : "Belum ada laporan masuk."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((report) => (
            <DramaItem key={report.id} report={report} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DramaItem({ report }: { report: DramaWithAuthor }) {
  const [state, formAction] = useActionState(replyDramaAction, idleState);
  const errors = state.fieldErrors ?? {};

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {report.is_urgent && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Prioritas
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {report.category}
        </span>
        <span className="text-xs text-slate-500">{formatDate(report.created_at)}</span>
      </div>

      <h3 className="mt-2 text-sm font-bold text-slate-900">{report.title}</h3>
      <p className="text-xs text-slate-500">
        {report.profiles?.full_name ?? "Peserta"}
        {report.profiles?.squad ? ` · ${report.profiles.squad}` : ""}
      </p>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {report.story}
      </p>

      {report.mentor_reply ? (
        <div className="mt-4 rounded-lg border-l-4 border-emerald-400 bg-emerald-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Balasan terkirim {report.replied_at ? `· ${formatDate(report.replied_at)}` : ""}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
            {report.mentor_reply}
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-4 space-y-2">
          <input type="hidden" name="reportId" value={report.id} />

          {state.status === "error" && state.message && (
          <Alert variant="error">
            <p>{state.message}</p>
            {state.detail && (
              <p className="mt-2 break-words font-mono text-[11px] opacity-70">
                Detail teknis: {state.detail}
              </p>
            )}
          </Alert>
        )}
          {state.status === "success" && <Alert variant="success">{state.message}</Alert>}

          <label htmlFor={`reply-${report.id}`} className="block text-xs font-medium text-slate-700">
            Cheat code solusi praktis
          </label>
          <textarea
            id={`reply-${report.id}`}
            name="reply"
            rows={3}
            required
            maxLength={2000}
            placeholder="Langkah konkret yang bisa peserta lakukan pekan ini..."
            className={cn(inputClass, "resize-y")}
          />
          {errors.reply?.[0] && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.reply[0]}
            </p>
          )}

          <SubmitButton pendingText="Mengirim..." className="sm:w-auto sm:px-6">
            Kirim Balasan
          </SubmitButton>
        </form>
      )}
    </li>
  );
}
