"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass, inputErrorClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, idleState);
  const errors = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <Alert variant="success">{state.message}</Alert>
        <Link
          href="/login"
          className="block rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.message && <Alert variant="error">{state.message}</Alert>}

      <Field label="Nama Lengkap" htmlFor="fullName" required errors={errors.fullName}>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          placeholder="Nama sesuai data mentoring"
          aria-invalid={Boolean(errors.fullName)}
          className={cn(inputClass, errors.fullName && inputErrorClass)}
        />
      </Field>

      <Field label="Email" htmlFor="email" required errors={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="nama@email.com"
          aria-invalid={Boolean(errors.email)}
          className={cn(inputClass, errors.email && inputErrorClass)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Squad / Kelompok" htmlFor="squad" errors={errors.squad}>
          <input
            id="squad"
            name="squad"
            type="text"
            placeholder="Squad 1"
            className={cn(inputClass, errors.squad && inputErrorClass)}
          />
        </Field>

        <Field label="Fakultas / Prodi" htmlFor="faculty" errors={errors.faculty}>
          <input
            id="faculty"
            name="faculty"
            type="text"
            placeholder="Ekonomi"
            className={cn(inputClass, errors.faculty && inputErrorClass)}
          />
        </Field>
      </div>

      <Field label="Nomor WhatsApp" htmlFor="phone" hint="Opsional — dipakai mentor untuk follow-up." errors={errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="081234567890"
          aria-invalid={Boolean(errors.phone)}
          className={cn(inputClass, errors.phone && inputErrorClass)}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        required
        hint="Minimal 8 karakter, kombinasi huruf dan angka."
        errors={errors.password}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
          className={cn(inputClass, errors.password && inputErrorClass)}
        />
      </Field>

      <Field label="Konfirmasi Password" htmlFor="confirmPassword" required errors={errors.confirmPassword}>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          aria-invalid={Boolean(errors.confirmPassword)}
          className={cn(inputClass, errors.confirmPassword && inputErrorClass)}
        />
      </Field>

      <SubmitButton pendingText="Mendaftarkan...">Daftar Sekarang</SubmitButton>

      <p className="text-center text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Masuk
        </Link>
      </p>
    </form>
  );
}
