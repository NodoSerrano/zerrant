/**
 * Marks that the user entered through the `/unirme` deep link (ZER-136), so
 * onboarding and the request screens continue the membership pipeline instead
 * of dropping the user into the tourist app. Only steers navigation; it grants
 * nothing, so a forged value just changes where redirects land.
 */
export const MEMBERSHIP_FLOW_COOKIE = "ns_flujo";
export const MEMBERSHIP_FLOW_VALUE = "membresia";

export const MEMBERSHIP_FLOW_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
} as const;

type CookieReader = { get(name: string): { value: string } | undefined };

export function isMembershipFlow(cookies: CookieReader): boolean {
  return cookies.get(MEMBERSHIP_FLOW_COOKIE)?.value === MEMBERSHIP_FLOW_VALUE;
}
