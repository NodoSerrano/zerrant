/**
 * Supabase Auth answers in English ("Invalid login credentials"). Show our
 * own Spanish copy by error code and never the raw message: an unknown error
 * gets the caller's fallback (and is logged for us).
 */
const AUTH_ERROR_COPY: Record<string, string> = {
  invalid_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed: "Todavía no confirmaste tu email. Revisá tu casilla.",
  user_already_exists: "Ya hay una cuenta con ese email. Iniciá sesión.",
  email_exists: "Ya hay una cuenta con ese email. Iniciá sesión.",
  weak_password: "La contraseña es muy débil. Probá con una más larga.",
  same_password: "La nueva contraseña tiene que ser distinta de la actual.",
  over_email_send_rate_limit:
    "Ya te mandamos un email hace poco. Esperá unos minutos y probá de nuevo.",
  over_request_rate_limit: "Hubo demasiados intentos. Esperá unos minutos y probá de nuevo.",
  email_address_invalid: "Revisá que el email esté bien escrito.",
  session_not_found: "Tu sesión expiró. Pedí un enlace nuevo.",
  session_expired: "Tu sesión expiró. Pedí un enlace nuevo.",
  otp_expired: "El enlace expiró o ya se usó. Pedí uno nuevo.",
  signup_disabled: "Por ahora no se pueden crear cuentas nuevas.",
};

export function authErrorMessage(
  error: { code?: string | null; message?: string },
  fallback: string,
): string {
  const copy = error.code ? AUTH_ERROR_COPY[error.code] : undefined;
  if (copy) return copy;
  console.error("[auth] error sin traducir", error.code, error.message);
  return fallback;
}

const LOGIN_FALLBACK = "No pudimos iniciar sesión. Probá de nuevo.";

/** Codes other routes put in `/auth/login?error=<code>`. */
const LOGIN_URL_ERROR_COPY: Record<string, string> = {
  auth_callback_failed: "No pudimos confirmar el enlace. Pedí uno nuevo o intentá de nuevo.",
  otp_expired: "El enlace expiró o ya se usó. Pedí uno nuevo desde el registro.",
  oauth_failed: "No pudimos iniciar sesión con Google. Probá de nuevo.",
};

/**
 * Only known codes render: anyone can build a link with `?error=<text>`, and
 * echoing it would put their message on our login page.
 */
export function loginUrlErrorMessage(raw: string | null): string | null {
  if (!raw) return null;
  return Object.hasOwn(LOGIN_URL_ERROR_COPY, raw) ? LOGIN_URL_ERROR_COPY[raw] : LOGIN_FALLBACK;
}
