import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Supabase client untuk Server Component, Route Handler, dan Server Action.
 * Session dibaca/ditulis lewat cookie httpOnly — aman, tidak bocor ke JS client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            // Menulis cookie dari Server Component memang ditolak Next.js, dan
            // itu aman diabaikan: refresh session tetap ditangani middleware.
            //
            // Tapi `catch` polos juga akan menelan sinyal internal Next
            // (redirect, notFound, bailout render dinamis). Sinyal itu
            // dipakai Next untuk mengatur alur, dan menelannya membuat
            // perilaku aplikasi tidak menentu. `unstable_rethrow` melempar
            // ulang khusus sinyal tersebut dan membiarkan sisanya lewat.
            unstable_rethrow(error);
          }
        },
      },
    },
  );
}
