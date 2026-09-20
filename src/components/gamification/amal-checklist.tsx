"use client";

import { useState, useTransition } from "react";

import { toggleAmalAction } from "@/lib/actions/gamification";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { AmalItemRow } from "@/lib/database.types";

export function AmalChecklist({
  items,
  checkedKeys,
  today,
}: {
  items: AmalItemRow[];
  checkedKeys: string[];
  today: string;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set(checkedKeys));
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(null);
  const [, startTransition] = useTransition();

  const doneCount = items.filter((item) => checked.has(item.key)).length;
  const allDone = doneCount === items.length && items.length > 0;
  const earned = items.reduce((sum, i) => (checked.has(i.key) ? sum + i.xp_reward : sum), 0);

  function toggle(item: AmalItemRow) {
    const next = !checked.has(item.key);

    // Optimistic: UI berubah duluan supaya terasa instan di HP,
    // lalu dikembalikan kalau server menolak.
    setChecked((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(item.key);
      else copy.delete(item.key);
      return copy;
    });
    setPendingKey(item.key);
    setError(null);

    const rollback = () =>
      setChecked((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(item.key);
        else copy.add(item.key);
        return copy;
      });

    startTransition(async () => {
      try {
        const result = await toggleAmalAction(item.key, next);
        setPendingKey(null);

        if (result.status === "error") {
          setError({ message: result.message, detail: result.detail });
          rollback();
        }
      } catch (e) {
        // Tanpa penangkapan di sini, promise yang gagal menembus ke error
        // boundary dan peserta hanya melihat "Ada yang bermasalah".
        setPendingKey(null);
        setError({
          message: "Permintaan ke server gagal.",
          detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
        });
        rollback();
      }
    });
  }

  return (
    <div className="space-y-4">
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

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {doneCount} dari {items.length} amalan
            </p>
            <p className="text-xs text-slate-500">
              +{earned} XP hari ini{allDone ? " · bonus lengkap +50 XP aktif" : ""}
            </p>
          </div>
          <span className="text-2xl font-bold text-brand-600">
            {items.length ? Math.round((doneCount / items.length) * 100) : 0}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-label="Progres amalan yaumi hari ini"
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              allDone ? "bg-emerald-500" : "bg-brand-500",
            )}
            style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const isChecked = checked.has(item.key);
          const isPending = pendingKey === item.key;

          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => toggle(item)}
                disabled={isPending}
                aria-pressed={isChecked}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition",
                  "focus:outline-none focus:ring-2 focus:ring-brand-500/40",
                  isChecked
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40",
                  isPending && "opacity-60",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 text-white transition",
                    isChecked ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white",
                  )}
                >
                  {isChecked && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      isChecked ? "text-emerald-900" : "text-slate-900",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      {item.description}
                    </span>
                  )}
                </span>

                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                    isChecked ? "bg-emerald-200 text-emerald-800" : "bg-slate-100 text-slate-500",
                  )}
                >
                  +{item.xp_reward}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-xs text-slate-400">
        Ceklis untuk {today} · otomatis kosong lagi besok pagi (WIB). Salah centang? Tekan sekali
        lagi untuk membatalkan.
      </p>
    </div>
  );
}
