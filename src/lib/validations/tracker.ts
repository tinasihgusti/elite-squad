import { z } from "zod";

const score = z.coerce
  .number({ invalid_type_error: "Skor wajib dipilih" })
  .int()
  .min(1, "Skor minimal 1")
  .max(5, "Skor maksimal 5");

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean(), z.undefined()])
  .transform((v) => v === "on" || v === "true" || v === true);

const optionalText = (max: number) =>
  z.string().trim().max(max, `Maksimal ${max} karakter`).optional().or(z.literal(""));

export const DRAMA_CATEGORIES = [
  "Akademik / kuliah",
  "Manajemen waktu",
  "Keuangan",
  "Relasi & pertemanan",
  "Kesehatan mental",
  "Organisasi / kepanitiaan",
  "Keluarga",
  "Lainnya",
] as const;

export const trackerSchema = z
  .object({
    weekNumber: z.coerce.number().int().min(1, "Minggu minimal 1").max(52, "Minggu maksimal 52"),
    weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal mulai minggu wajib diisi"),
    attendance: z.enum(["hadir", "izin", "sakit", "alpa"], {
      errorMap: () => ({ message: "Status kehadiran wajib dipilih" }),
    }),
    sessionTopic: optionalText(160),

    scoreSpiritual: score,
    scoreAcademic: score,
    scorePhysical: score,
    scoreSocial: score,
    scoreMental: score,

    habitWorship: checkbox,
    habitReading: checkbox,
    habitExercise: checkbox,
    habitSleep: checkbox,
    habitJournaling: checkbox,

    dramaCategory: z.enum(DRAMA_CATEGORIES).optional().or(z.literal("")),
    dramaStory: optionalText(2000),
    dramaActionPlan: optionalText(1000),
    needsFollowup: checkbox,

    mentorRating: z.coerce.number().int().min(1).max(5).optional(),
    sessionFeedback: optionalText(2000),
    suggestion: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    // Kalau minta follow-up mentor, ceritanya harus ada — supaya mentor punya konteks.
    if (data.needsFollowup && !data.dramaStory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dramaStory"],
        message: "Ceritakan kendalanya dulu kalau kamu minta follow-up mentor",
      });
    }
    if (data.attendance === "hadir" && !data.mentorRating) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mentorRating"],
        message: "Beri penilaian sesi mentoring minggu ini",
      });
    }
  });

export type TrackerInput = z.infer<typeof trackerSchema>;
