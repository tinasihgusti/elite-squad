import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  errors?: string[];
  children: ReactNode;
  className?: string;
};

export function Field({
  label,
  htmlFor,
  hint,
  required,
  errors,
  children,
  className,
}: FieldProps) {
  const hasError = Boolean(errors?.length);

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !hasError && <p className="text-xs text-slate-500">{hint}</p>}
      {hasError && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 " +
  "placeholder:text-slate-400 shadow-sm transition focus:border-brand-500 focus:outline-none " +
  "focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-50";

export const inputErrorClass = "border-red-400 focus:border-red-500 focus:ring-red-500/30";
