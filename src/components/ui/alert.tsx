import { cn } from "@/lib/utils";

type AlertProps = {
  variant: "success" | "error" | "info";
  children: React.ReactNode;
  className?: string;
};

const styles: Record<AlertProps["variant"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-brand-200 bg-brand-50 text-brand-800",
};

export function Alert({ variant, children, className }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn("rounded-lg border px-4 py-3 text-sm", styles[variant], className)}
    >
      {children}
    </div>
  );
}
