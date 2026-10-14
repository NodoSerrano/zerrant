import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeInternalPath } from "@/lib/safe-next";

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const errorCode = searchParams.get("error_code");
  const rawNext = searchParams.get("next");
  const next = safeInternalPath(rawNext);
  // Built with URL, never string concat: `${origin}${next}` let `next=@evil.com`
  // redirect off-site (ZER-136).
  const success = () => NextResponse.redirect(new URL(next, origin));

  if (errorCode === "otp_expired") {
    const login = new URL("/auth/login", origin);
    login.searchParams.set("error", "otp_expired");
    if (rawNext !== null && next !== "/") login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return success();
    }
  } else if (tokenHash && type && OTP_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return success();
    }
  }

  const failed = new URL("/auth/login", origin);
  failed.searchParams.set("error", "auth_callback_failed");
  // Keep the deep link (e.g. /unirme) so the user resumes it after logging in.
  if (next !== "/") failed.searchParams.set("next", next);
  return NextResponse.redirect(failed);
}
