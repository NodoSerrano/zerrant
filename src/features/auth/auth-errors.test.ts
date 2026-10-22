import { describe, expect, it, vi } from "vitest";
import { authErrorMessage, loginUrlErrorMessage } from "./auth-errors";

const FALLBACK = "No pudimos iniciar sesión. Probá de nuevo.";

describe("authErrorMessage", () => {
  it.each([
    ["invalid_credentials", "Email o contraseña incorrectos."],
    ["email_not_confirmed", "Todavía no confirmaste tu email. Revisá tu casilla."],
    ["user_already_exists", "Ya hay una cuenta con ese email. Iniciá sesión."],
    ["email_exists", "Ya hay una cuenta con ese email. Iniciá sesión."],
    ["weak_password", "La contraseña es muy débil. Probá con una más larga."],
    ["same_password", "La nueva contraseña tiene que ser distinta de la actual."],
    [
      "over_email_send_rate_limit",
      "Ya te mandamos un email hace poco. Esperá unos minutos y probá de nuevo.",
    ],
    ["over_request_rate_limit", "Hubo demasiados intentos. Esperá unos minutos y probá de nuevo."],
    ["email_address_invalid", "Revisá que el email esté bien escrito."],
  ])("translates %s to Spanish", (code, message) => {
    expect(authErrorMessage({ code, message: "english text" }, FALLBACK)).toBe(message);
  });

  it("never shows Supabase's English text for an unknown error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(authErrorMessage({ code: "something_new", message: "Something new" }, FALLBACK)).toBe(
      FALLBACK,
    );
    expect(authErrorMessage({ message: "No code at all" }, FALLBACK)).toBe(FALLBACK);
  });
});

describe("loginUrlErrorMessage", () => {
  it("shows the copy for a known code", () => {
    expect(loginUrlErrorMessage("otp_expired")).toBe(
      "El enlace expiró o ya se usó. Pedí uno nuevo desde el registro.",
    );
    expect(loginUrlErrorMessage("oauth_failed")).toBe(
      "No pudimos iniciar sesión con Google. Probá de nuevo.",
    );
  });

  // Anyone can build a link with ?error=<text>: showing it would let them put
  // their own message on our login page.
  it("never echoes free text from the URL", () => {
    expect(loginUrlErrorMessage("Tu cuenta fue suspendida, escribinos a soporte@x.com")).toBe(
      FALLBACK,
    );
  });

  it("shows nothing without an error", () => {
    expect(loginUrlErrorMessage(null)).toBeNull();
    expect(loginUrlErrorMessage("")).toBeNull();
  });
});
