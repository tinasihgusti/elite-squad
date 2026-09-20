"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass, inputErrorClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, idleState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state.status === "error" && state.message && <Alert variant="error">{state.message}</Alert>}

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

      <Field label="Password" htmlFor="password" required errors={errors.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
          className={cn(inputClass, errors.password && inputErrorClass)}
        />
      </Field>

      <SubmitButton pendingText="Masuk...">Masuk</SubmitButton>

      <p className="text-center text-sm text-slate-600">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Daftar di sini
        </Link>
      </p>
    </form>
  );
}
