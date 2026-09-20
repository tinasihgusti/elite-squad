/** Gabung className secara kondisional tanpa dependensi tambahan. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const WIB = "id-ID";

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(WIB, { dateStyle: "medium" }).format(date);
}

/** Senin pada minggu berjalan, dalam format YYYY-MM-DD. */
export function currentMonday(today = new Date()): string {
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const day = d.getUTCDay() || 7; // Minggu = 7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

/** Nomor minggu ISO-8601. */
export function isoWeekNumber(today = new Date()): number {
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
