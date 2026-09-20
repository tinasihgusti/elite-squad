import { logoutAction } from "@/lib/actions/auth";
import { NavLink } from "./nav-link";
import { initials } from "@/lib/utils";
import type { ProfileRow } from "@/lib/database.types";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/amalan", label: "Amalan Yaumi" },
  { href: "/misi", label: "Misi & Modul" },
  { href: "/drama", label: "Maba Drama" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tracker", label: "Tracker" },
  { href: "/rekap", label: "Rekap" },
];

export function AppShell({
  profile,
  children,
}: {
  profile: ProfileRow;
  children: React.ReactNode;
}) {
  const isStaff = profile.role === "mentor" || profile.role === "admin";
  const navItems = isStaff ? [...NAV, { href: "/admin", label: "Panel Mentor" }] : NAV;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white"
            >
              {initials(profile.full_name) || "ES"}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold text-slate-900">{profile.full_name}</p>
              <p className="text-xs text-slate-500">{profile.squad ?? "Elite Squad"}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Keluar
            </button>
          </form>
        </div>

        <nav
          aria-label="Navigasi utama"
          className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-3 pb-2"
        >
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
