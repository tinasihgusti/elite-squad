"use client";

import { cn } from "@/lib/utils";

type ScoreScaleProps = {
  name: string;
  label: string;
  description: string;
  defaultValue?: number;
  error?: string[];
};

const VALUES = [1, 2, 3, 4, 5];

export function ScoreScale({ name, label, description, defaultValue, error }: ScoreScaleProps) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-800">{label}</legend>
      <p className="text-xs text-slate-500">{description}</p>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {VALUES.map((value) => (
          <label
            key={value}
            className="group cursor-pointer text-center"
            title={`${value} dari 5`}
          >
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
              required
              className="peer sr-only"
            />
            <span
              className={cn(
                "block rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-600 transition",
                "hover:border-brand-400 hover:bg-brand-50",
                "peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40",
              )}
            >
              {value}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
        <span>1 · sangat kurang</span>
        <span>5 · sangat baik</span>
      </div>

      {error?.[0] && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {error[0]}
        </p>
      )}
    </fieldset>
  );
}
