"use client";

import { useState, useTransition } from "react";

import { toggleModuleAction } from "@/lib/actions/gamification";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ModuleCompletionRow, ModuleSessionRow } from "@/lib/database.types";

export function ModuleList({
  sessions,
  completions,
}: {
  sessions: ModuleSessionRow[];
  completions: ModuleCompletionRow[];
}) {
  const [done, setDone] = useState<Map<number, ModuleCompletionRow>>(
    new Map(completions.map((c) => [c.session_number, c])),
  );
  const [openSession, setOpenSession] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(null);
  const [, startTransition] = useTransition();

  function toggle(session: ModuleSessionRow) {
    const existing = done.get(session.session_number);

    if (existing?.verified_at) {
      setError({
        message: `Sesi ${session.session_number} sudah diverifikasi mentor. Hubungi mentor kalau perlu dikoreksi.`,
      });
      return;
    }

    const next = !existing;
    setPending(session.session_number);
    setError(null);

    startTransition(async () => {
      let result;
      try {
        result = await toggleModuleAction(session.session_number, next);
      } catch (e) {
        setPending(null);
        setError({
          message: "Permintaan ke server gagal.",
          detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
        });
        return;
      }
      setPending(null);

      if (result.status === "error") {
        setError({ message: result.message, detail: result.detail });
        return;
      }

      // Ikuti daftar yang dikembalikan server, bukan tebakan lokal.
      const fromServer = result.keys?.map(Number);
      setDone((prev) => {
        const copy = new Map(prev);
        if (fromServer) {
          for (const num of Array.from(copy.keys())) {
            if (!fromServer.includes(num)) copy.delete(num);
          }
          for (const num of fromServer) {
            if (!copy.has(num)) {
              copy.set(num, {
                id: `server-${num}`,
                user_id: "",
                session_number: num,
                reflection: null,
                completed_on: new Date().toISOString().slice(0, 10),
                verified_by: null,
                verified_at: null,
                created_at: new Date().toISOString(),
              });
            }
          }
        } else if (next) {
          copy.set(session.session_number, {
            id: `optimistic-${session.session_number}`,
            user_id: "",
            session_number: session.session_number,
            reflection: null,
            completed_on: new Date().toISOString().slice(0, 10),
            verified_by: null,
            verified_at: null,
            created_at: new Date().toISOString(),
          });
        } else {
          copy.delete(session.session_number);
        }
        return copy;
      });
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="error">
          <p>{error.message}</p>
          {error.detail && (
            <p className="mt-2 break-words font-mono text-[11px] opacity-70">
              Detail teknis: {error.detail}
            </p>
          )}
        </Alert>
      )}

      {sessions.map((session) => {
        const completion = done.get(session.session_number);
        const isDone = Boolean(completion);
        const isVerified = Boolean(completion?.verified_at);
        const isOpen = openSession === session.session_number;
        const isPending = pending === session.session_number;

        return (
          <article
            key={session.session_number}
            className={cn(
              "rounded-xl border bg-white shadow-sm transition",
              isDone ? "border-emerald-300" : "border-slate-200",
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <button
                type="button"
                onClick={() => toggle(session)}
                disabled={isPending}
                aria-pressed={isDone}
                aria-label={`Tandai Sesi ${session.session_number} sudah diikuti`}
                className={cn(
                  "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 text-sm font-bold transition",
                  "focus:outline-none focus:ring-2 focus:ring-brand-500/40",
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-slate-400 hover:border-brand-400",
                  isPending && "opacity-50",
                )}
              >
                {isDone ? "✓" : session.session_number}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Sesi {session.session_number} · {session.theme}
                  </span>
                  {isVerified && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Terverifikasi mentor
                    </span>
                  )}
                </div>

                <h3 className="mt-0.5 text-sm font-bold text-slate-900">{session.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{session.phase}</p>

                <button
                  type="button"
                  onClick={() => setOpenSession(isOpen ? null : session.session_number)}
                  aria-expanded={isOpen}
                  className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  {isOpen ? "Tutup detail" : "Lihat detail materi"}
                </button>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                +{session.xp_reward}
              </span>
            </div>

            {isOpen && (
              <div className="space-y-3 border-t border-slate-100 bg-slate-50 px-4 py-4 text-xs leading-relaxed">
                <div>
                  <p className="font-semibold text-slate-700">Fokus materi</p>
                  <p className="mt-0.5 text-slate-600">{session.focus}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Indikator Juklak</p>
                  <p className="mt-0.5 text-slate-600">{session.juklak_indicator}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Metode sesi</p>
                  <p className="mt-0.5 text-slate-600">{session.delivery}</p>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
