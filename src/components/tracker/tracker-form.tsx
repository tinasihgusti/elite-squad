"use client";

import { useEffect, useRef, useActionState } from "react";

import { submitTrackerAction } from "@/lib/actions/tracker";
import { idleState } from "@/lib/actions/types";
import { DRAMA_CATEGORIES } from "@/lib/validations/tracker";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, inputClass, inputErrorClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckboxItem } from "./checkbox-item";
import { ScoreScale } from "./score-scale";
import { cn, currentMonday, isoWeekNumber } from "@/lib/utils";
import type { ProfileRow, WeeklyTrackerRow } from "@/lib/database.types";

const ATTENDANCE_OPTIONS = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alpa", label: "Tanpa keterangan" },
] as const;

const SCORES = [
  {
    name: "scoreSpiritual",
    label: "Spiritual",
    description: "Kualitas ibadah dan ketenangan batin sepekan ini.",
  },
  {
    name: "scoreAcademic",
    label: "Akademik",
    description: "Kehadiran kuliah, tugas, dan pemahaman materi.",
  },
  {
    name: "scorePhysical",
    label: "Fisik",
    description: "Olahraga, pola makan, dan kualitas istirahat.",
  },
  {
    name: "scoreSocial",
    label: "Sosial",
    description: "Relasi dengan teman, keluarga, dan lingkungan kampus.",
  },
  {
    name: "scoreMental",
    label: "Mental & Emosi",
    description: "Pengelolaan stres, fokus, dan motivasi diri.",
  },
] as const;

const HABITS = [
  { name: "habitWorship", label: "Ibadah rutin", description: "Konsisten minimal 5 hari" },
  { name: "habitReading", label: "Membaca", description: "Minimal 15 menit per hari" },
  { name: "habitExercise", label: "Olahraga", description: "Minimal 3× sepekan" },
  { name: "habitSleep", label: "Tidur cukup", description: "6–8 jam per malam" },
  { name: "habitJournaling", label: "Journaling / refleksi", description: "Catat progres harian" },
] as const;

type ScoreKey = (typeof SCORES)[number]["name"];

export function TrackerForm({
  profile,
  existing,
  defaultWeek,
}: {
  profile: ProfileRow;
  existing: WeeklyTrackerRow | null;
  defaultWeek?: number;
}) {
  const [state, formAction] = useActionState(submitTrackerAction, idleState);
  const errors = state.fieldErrors ?? {};
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Arahkan fokus ke pesan hasil supaya jelas di mobile dan bagi pengguna screen reader.
  useEffect(() => {
    if (state.status !== "idle") feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  const week = existing?.week_number ?? defaultWeek ?? isoWeekNumber();
  const weekStart = existing?.week_start_date ?? currentMonday();

  const scoreDefault = (key: ScoreKey): number | undefined => {
    if (!existing) return undefined;
    const map: Record<ScoreKey, number> = {
      scoreSpiritual: existing.score_spiritual,
      scoreAcademic: existing.score_academic,
      scorePhysical: existing.score_physical,
      scoreSocial: existing.score_social,
      scoreMental: existing.score_mental,
    };
    return map[key];
  };

  const habitDefault = (name: (typeof HABITS)[number]["name"]): boolean => {
    if (!existing) return false;
    const map: Record<(typeof HABITS)[number]["name"], boolean> = {
      habitWorship: existing.habit_worship,
      habitReading: existing.habit_reading,
      habitExercise: existing.habit_exercise,
      habitSleep: existing.habit_sleep,
      habitJournaling: existing.habit_journaling,
    };
    return map[name];
  };

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div ref={feedbackRef}>
        {state.status === "error" && state.message && <Alert variant="error">{state.message}</Alert>}
        {state.status === "success" && <Alert variant="success">{state.message}</Alert>}
      </div>

      {/* --- 1. Kehadiran & identitas --- */}
      <Card>
        <CardHeader
          title="1. Kehadiran & Identitas"
          description="Data diri terisi otomatis dari profil akunmu."
        />

        <div className="mb-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Nama</p>
            <p className="text-sm font-medium text-slate-900">{profile.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Squad</p>
            <p className="text-sm font-medium text-slate-900">{profile.squad ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Fakultas / Prodi</p>
            <p className="text-sm font-medium text-slate-900">{profile.faculty ?? "—"}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minggu ke-" htmlFor="weekNumber" required errors={errors.weekNumber}>
            <input
              id="weekNumber"
              name="weekNumber"
              type="number"
              min={1}
              max={52}
              required
              defaultValue={week}
              readOnly={Boolean(existing)}
              className={cn(inputClass, errors.weekNumber && inputErrorClass)}
            />
          </Field>

          <Field
            label="Tanggal mulai minggu"
            htmlFor="weekStartDate"
            required
            hint="Senin pada pekan yang dilaporkan."
            errors={errors.weekStartDate}
          >
            <input
              id="weekStartDate"
              name="weekStartDate"
              type="date"
              required
              defaultValue={weekStart}
              className={cn(inputClass, errors.weekStartDate && inputErrorClass)}
            />
          </Field>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-slate-700">
            Status kehadiran sesi mentoring <span className="text-red-500">*</span>
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ATTENDANCE_OPTIONS.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="attendance"
                  value={option.value}
                  required
                  defaultChecked={(existing?.attendance ?? "hadir") === option.value}
                  className="peer sr-only"
                />
                <span className="block rounded-lg border border-slate-300 py-2 text-center text-sm font-medium text-slate-600 transition hover:border-brand-400 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {errors.attendance?.[0] && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {errors.attendance[0]}
            </p>
          )}
        </fieldset>

        <Field
          label="Topik sesi minggu ini"
          htmlFor="sessionTopic"
          className="mt-4"
          errors={errors.sessionTopic}
        >
          <input
            id="sessionTopic"
            name="sessionTopic"
            type="text"
            defaultValue={existing?.session_topic ?? ""}
            placeholder="Contoh: Manajemen waktu & prioritas"
            className={cn(inputClass, errors.sessionTopic && inputErrorClass)}
          />
        </Field>
      </Card>

      {/* --- 2. Mini self-check --- */}
      <Card>
        <CardHeader
          title="2. Mini Self-Check"
          description="Nilai dirimu jujur di skala 1–5. Ini untuk refleksi, bukan penilaian mentor."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {SCORES.map((item) => (
            <ScoreScale
              key={item.name}
              name={item.name}
              label={item.label}
              description={item.description}
              defaultValue={scoreDefault(item.name)}
              error={errors[item.name]}
            />
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">Indikator kebiasaan harian</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {HABITS.map((habit) => (
              <CheckboxItem
                key={habit.name}
                name={habit.name}
                label={habit.label}
                description={habit.description}
                defaultChecked={habitDefault(habit.name)}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* --- 3. Maba Drama --- */}
      <Card>
        <CardHeader
          title='3. "Maba Drama" — Ruang Kendala'
          description="Ceritakan hambatan sepekan ini. Hanya kamu dan mentor yang bisa membacanya."
        />

        <Field label="Kategori kendala" htmlFor="dramaCategory" errors={errors.dramaCategory}>
          <select
            id="dramaCategory"
            name="dramaCategory"
            defaultValue={existing?.drama_category ?? ""}
            className={cn(inputClass, errors.dramaCategory && inputErrorClass)}
          >
            <option value="">— Tidak ada kendala berarti —</option>
            {DRAMA_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Ceritakan kendalanya"
          htmlFor="dramaStory"
          className="mt-4"
          hint="Maksimal 2000 karakter."
          errors={errors.dramaStory}
        >
          <textarea
            id="dramaStory"
            name="dramaStory"
            rows={4}
            maxLength={2000}
            defaultValue={existing?.drama_story ?? ""}
            placeholder="Apa yang terjadi, sejak kapan, dan bagian mana yang paling berat?"
            className={cn(inputClass, "resize-y", errors.dramaStory && inputErrorClass)}
          />
        </Field>

        <Field
          label="Rencana aksi minggu depan"
          htmlFor="dramaActionPlan"
          className="mt-4"
          hint="Satu langkah kecil yang realistis lebih baik daripada rencana besar yang tidak jalan."
          errors={errors.dramaActionPlan}
        >
          <textarea
            id="dramaActionPlan"
            name="dramaActionPlan"
            rows={3}
            maxLength={1000}
            defaultValue={existing?.drama_action_plan ?? ""}
            placeholder="Contoh: bangun pukul 05.00 dan kerjakan tugas 30 menit sebelum kuliah."
            className={cn(inputClass, "resize-y", errors.dramaActionPlan && inputErrorClass)}
          />
        </Field>

        <div className="mt-4">
          <CheckboxItem
            name="needsFollowup"
            label="Saya ingin di-follow up mentor"
            description="Mentor akan menghubungi lewat WhatsApp dalam 3 hari kerja."
            defaultChecked={existing?.needs_followup ?? false}
          />
        </div>
      </Card>

      {/* --- 4. Feedback sesi --- */}
      <Card>
        <CardHeader
          title="4. Feedback Sesi Mentoring"
          description="Masukanmu dipakai untuk memperbaiki sesi berikutnya."
        />

        <ScoreScale
          name="mentorRating"
          label="Penilaian sesi minggu ini"
          description="Seberapa bermanfaat sesi mentoring pekan ini buat kamu?"
          defaultValue={existing?.mentor_rating ?? undefined}
          error={errors.mentorRating}
        />

        <Field
          label="Hal paling bermanfaat dari sesi ini"
          htmlFor="sessionFeedback"
          className="mt-4"
          errors={errors.sessionFeedback}
        >
          <textarea
            id="sessionFeedback"
            name="sessionFeedback"
            rows={3}
            maxLength={2000}
            defaultValue={existing?.session_feedback ?? ""}
            className={cn(inputClass, "resize-y", errors.sessionFeedback && inputErrorClass)}
          />
        </Field>

        <Field
          label="Saran perbaikan untuk mentor / program"
          htmlFor="suggestion"
          className="mt-4"
          errors={errors.suggestion}
        >
          <textarea
            id="suggestion"
            name="suggestion"
            rows={3}
            maxLength={1000}
            defaultValue={existing?.suggestion ?? ""}
            className={cn(inputClass, "resize-y", errors.suggestion && inputErrorClass)}
          />
        </Field>
      </Card>

      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <SubmitButton pendingText="Menyimpan...">
          {existing ? "Perbarui Tracker" : "Simpan Tracker Mingguan"}
        </SubmitButton>
      </div>
    </form>
  );
}
