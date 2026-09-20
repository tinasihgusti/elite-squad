import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Endpoint tujuan link verifikasi email / magic link Supabase.
 * Menukar `code` menjadi session cookie lalu mengarahkan ke dashboard.
 */

// Route ini membaca query string dan menulis cookie session, jadi tidak boleh
// di-prerender atau di-cache saat build. Dideklarasikan eksplisit supaya
// perilakunya tidak berubah kalau default Next.js bergeser di versi berikutnya.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback]", error.message);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Di belakang proxy Vercel, x-forwarded-host adalah host yang benar.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "production" && forwardedHost ? `https://${forwardedHost}` : origin;

  return NextResponse.redirect(`${base}${safeNext}`);
}
