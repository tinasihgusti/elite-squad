import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getProfile } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  // Middleware sudah menjaga route ini, tapi cek ulang di server
  // supaya `profile` dijamin ada untuk seluruh halaman di bawahnya.
  if (!profile) redirect("/login");

  return <AppShell profile={profile}>{children}</AppShell>;
}
