import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseCookieOptions } from "./cookie-options";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookieOptions: supabaseCookieOptions() },
  );
}
