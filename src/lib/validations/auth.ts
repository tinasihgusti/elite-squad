import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120),
    email: z.string().trim().toLowerCase().email("Format email tidak valid"),
    squad: z.string().trim().max(60).optional().or(z.literal("")),
    faculty: z.string().trim().max(80).optional().or(z.literal("")),
    phone: z
      .string()
      .trim()
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, "Nomor WhatsApp tidak valid (contoh: 081234567890)")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Za-z]/, "Password harus mengandung huruf")
      .regex(/[0-9]/, "Password harus mengandung angka"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
