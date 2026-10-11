import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore when
            // middleware is refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Lightweight auth check for read paths. `getClaims` verifies the JWT locally
 * when the project uses asymmetric signing keys (falling back to `getUser()`
 * otherwise), avoiding an Auth server round-trip on every page render.
 * Mutations should keep using `auth.getUser()`.
 */
export async function getAuthClaims(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ id: string; email: string | null } | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
}
