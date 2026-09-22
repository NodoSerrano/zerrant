/**
 * Client-visible flag for Google OAuth CTA on login/signup.
 * Keep off until the provider is productized. Re-enable with:
 *   NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
 * The signInWithGoogle server action stays available either way.
 */
export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}
