import { publicAppHref } from "@/lib/public-url";
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
  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const searchParams = requestUrl.searchParams;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const errorCode = searchParams.get("error_code");
  const rawNext = searchParams.get("next");
  const next = safeInternalPath(rawNext);
  // `next` is validated first. String-joining it onto SITE_URL is safe, and
  // required when SITE_URL already includes a base path (ZER-136 + hosted subpath).
  const success = () => NextResponse.redirect(publicAppHref(next, requestOrigin));

  if (errorCode === "otp_expired") {
    const login = new URL(publicAppHref("/auth/login", requestOrigin));
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

  const failed = new URL(publicAppHref("/auth/login", requestOrigin));
  failed.searchParams.set("error", "auth_callback_failed");
  // Keep the deep link (e.g. /unirme) so the user resumes it after logging in.
  if (next !== "/") failed.searchParams.set("next", next);
  return NextResponse.redirect(failed);
}
