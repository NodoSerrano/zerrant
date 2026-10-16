/**
 * Test and prod share nogal-labs.com.ar. Supabase names the session cookie
 * from the hostname, so both apps would fight over sb-nogal-labs-auth-token.
 * Set NEXT_PUBLIC_SUPABASE_COOKIE_NAME per environment and scope the cookie
 * to the app base path.
 */
export function supabaseCookieOptions():
  | {
      name?: string;
      path: string;
      sameSite: "lax";
      secure: boolean;
    }
  | undefined {
  const name = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";
  if (!name && !basePath) return undefined;

  return {
    ...(name ? { name } : {}),
    path: basePath || "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}
