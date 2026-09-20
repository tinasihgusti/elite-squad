"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

import { DRAMA_CATEGORIES, submitDramaAction } from "@/lib/actions/gamification";
import { idleState } from "@/lib/actions/types";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, inputClass, inputErrorClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function DramaForm({ alreadyEarnedToday }: { alreadyEarnedToday: boolean }) {
  const [state, formAction] = useFormState(submitDramaAction, idleState);
  const errors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Kosongkan form setelah laporan berhasil terkirim.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <Card>
      <CardHeader
        title="Tulis Maba Drama"
        description="Ceritakan kendala kelompok binaanmu. Mentor membalas dengan solusi praktis."
      />

      <form ref={formRef} action={formAction} className="space-y-4" noValidate>
        {state.status === "error" && state.message && <Alert variant="error">{state.message}</Alert>}
        {state.status === "success" && <Alert variant="success">{state.message}</Alert>}

        {alreadyEarnedToday && state.status !== "success" && (
          <Alert variant="info">
            Kamu sudah dapat XP Maba Drama hari ini. Laporan tambahan tetap dibaca mentor, tapi
            tidak menambah XP lagi — biar leaderboard tetap adil.
          </Alert>
        )}

        <Field label="Kategori kendala" htmlFor="category" required errors={errors.category}>
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className={cn(inputClass, errors.category && inputErrorClass)}
          >
            <option value="" disabled>
              — Pilih kategori —
            </option>
            {DRAMA_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Judul singkat" htmlFor="title" required errors={errors.title}>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={140}
            placeholder="Contoh: Tiga maba menghilang dari grup sejak pekan lalu"
            className={cn(inputClass, errors.title && inputErrorClass)}
          />
        </Field>

        <Field
          label="Ceritanya"
          htmlFor="story"
          required
          hint="Makin konkret kronologinya, makin tepat solusi yang mentor berikan."
          errors={errors.story}
        >
          <textarea
            id="story"
            name="story"
            rows={5}
            required
            maxLength={2000}
            placeholder="Apa yang terjadi, sudah dicoba apa saja, dan bagian mana yang bikin kamu mentok?"
            className={cn(inputClass, "resize-y", errors.story && inputErrorClass)}
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50">
          <input
            type="checkbox"
            name="isUrgent"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-amber-600 focus:ring-amber-500/40"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">Butuh respons cepat</span>
            <span className="block text-xs text-slate-500">
              Laporan ditandai prioritas di panel mentor.
            </span>
          </span>
        </label>

        <SubmitButton pendingText="Mengirim...">Kirim Laporan (+40 XP)</SubmitButton>
      </form>
    </Card>
  );
}
