"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
};

export function SubmitButton({ children, pendingText, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5",
        "text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {pending && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {pending ? (pendingText ?? "Memproses...") : children}
    </button>
  );
}
