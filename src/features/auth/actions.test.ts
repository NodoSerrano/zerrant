import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  resend: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ auth: authMock }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => navigationMocks.revalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => navigationMocks.redirect(url),
}));

import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  sendPasswordReset,
  resetPassword,
  signOut,
  resendSignupEmail,
} from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  navigationMocks.redirect.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
});

describe("signInWithPassword", () => {
  const makeFormData = () => {
    const fd = new FormData();
    fd.set("email", "test@example.com");
    fd.set("password", "secret123");
    return fd;
  };

  it("calls supabase.auth.signInWithPassword with form data and redirects on success", async () => {
    authMock.signInWithPassword.mockResolvedValue({ error: null });

    await expect(signInWithPassword(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT:/");

    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "secret123",
    });
    expect(navigationMocks.redirect).toHaveBeenCalledWith("/");
  });

  it("returns error message when supabase returns an error", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });

    const result = await signInWithPassword(null, makeFormData());

    expect(result).toEqual({ error: "Invalid credentials" });
    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "secret123",
    });
  });
});

describe("signUpWithPassword", () => {
  const makeFormData = () => {
    const fd = new FormData();
    fd.set("email", "newuser@example.com");
    fd.set("password", "newpass456");
    return fd;
  };

  it("calls supabase.auth.signUp with credentials and emailRedirectTo", async () => {
    authMock.signUp.mockResolvedValue({ data: { session: null, user: { id: "u1" } }, error: null });

    await expect(signUpWithPassword(null, makeFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/auth/check-email?email=newuser%40example.com&flow=signup",
    );

    expect(authMock.signUp).toHaveBeenCalledWith({
      email: "newuser@example.com",
      password: "newpass456",
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });

  it("redirects to check-email when signup returns no session (confirmations on)", async () => {
    authMock.signUp.mockResolvedValue({ data: { session: null, user: { id: "u1" } }, error: null });

    await expect(signUpWithPassword(null, makeFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/auth/check-email?email=newuser%40example.com&flow=signup",
    );

    expect(navigationMocks.redirect).toHaveBeenCalledWith(
      "/auth/check-email?email=newuser%40example.com&flow=signup",
    );
    expect(navigationMocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("enters the app when signup returns a live session (confirmations off)", async () => {
    authMock.signUp.mockResolvedValue({
      data: { session: { access_token: "tok" }, user: { id: "u1" } },
      error: null,
    });

    await expect(signUpWithPassword(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT:/");

    expect(navigationMocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(navigationMocks.redirect).toHaveBeenCalledWith("/");
  });

  it("returns error message when supabase returns an error", async () => {
    authMock.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Email already registered" },
    });

    const result = await signUpWithPassword(null, makeFormData());

    expect(result).toEqual({ error: "Email already registered" });
    expect(navigationMocks.redirect).not.toHaveBeenCalled();
  });
});

describe("resendSignupEmail", () => {
  const makeFormData = (email = "newuser@example.com") => {
    const fd = new FormData();
    fd.set("email", email);
    return fd;
  };

  it("calls supabase.auth.resend with signup type and emailRedirectTo", async () => {
    authMock.resend.mockResolvedValue({ data: {}, error: null });

    const result = await resendSignupEmail(null, makeFormData());

    expect(authMock.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "newuser@example.com",
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback",
      },
    });
    expect(result).toEqual({ success: true });
  });

  it("returns the supabase error message (including rate limits)", async () => {
    authMock.resend.mockResolvedValue({
      data: {},
      error: { message: "email rate limit exceeded" },
    });

    const result = await resendSignupEmail(null, makeFormData());

    expect(result).toEqual({ error: "email rate limit exceeded" });
  });

  it("returns a validation error when email is missing", async () => {
    const result = await resendSignupEmail(null, new FormData());

    expect(result).toEqual({ error: "Necesitamos tu email para reenviar el enlace." });
    expect(authMock.resend).not.toHaveBeenCalled();
  });
});

describe("signInWithGoogle", () => {
  it("calls supabase.auth.signInWithOAuth with google provider and redirectTo option", async () => {
    authMock.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/auth" },
      error: null,
    });

    await expect(signInWithGoogle(new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:https://accounts.google.com/o/oauth2/auth",
    );

    expect(authMock.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });

  it("redirects to login with encoded error when supabase returns an error", async () => {
    authMock.signInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: "Provider not enabled" },
    });

    await expect(signInWithGoogle(new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/auth/login?error=Provider%20not%20enabled",
    );

    expect(authMock.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });
});

describe("sendPasswordReset", () => {
  const makeFormData = () => {
    const fd = new FormData();
    fd.set("email", "forgot@example.com");
    return fd;
  };

  it("calls supabase.auth.resetPasswordForEmail with email and redirectTo", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({ error: null });

    await expect(sendPasswordReset(null, makeFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/auth/check-email?email=forgot%40example.com&flow=recovery",
    );

    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith("forgot@example.com", {
      redirectTo: "http://localhost:3000/auth/reset-password",
    });
  });

  it("returns error message when supabase returns an error", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({
      error: { message: "Email not found" },
    });

    const result = await sendPasswordReset(null, makeFormData());

    expect(result).toEqual({ error: "Email not found" });
  });
});

describe("resetPassword", () => {
  const makeFormData = (confirm = "newsecurepass") => {
    const fd = new FormData();
    fd.set("password", "newsecurepass");
    fd.set("confirmPassword", confirm);
    return fd;
  };

  it("calls supabase.auth.updateUser with new password and redirects on success", async () => {
    authMock.updateUser.mockResolvedValue({ error: null });

    await expect(resetPassword(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT:/");

    expect(authMock.updateUser).toHaveBeenCalledWith({
      password: "newsecurepass",
    });
  });

  it("returns a mismatch error and does not call updateUser when passwords differ", async () => {
    const result = await resetPassword(null, makeFormData("otherpass"));

    expect(result).toEqual({ error: "Las contraseñas no coinciden" });
    expect(authMock.updateUser).not.toHaveBeenCalled();
  });

  it("returns a length error and does not call updateUser when password is too short", async () => {
    const fd = new FormData();
    fd.set("password", "123");
    fd.set("confirmPassword", "123");

    const result = await resetPassword(null, fd);

    expect(result).toEqual({ error: "La contraseña debe tener al menos 6 caracteres" });
    expect(authMock.updateUser).not.toHaveBeenCalled();
  });

  it("returns error message when supabase returns an error", async () => {
    authMock.updateUser.mockResolvedValue({
      error: { message: "Password too weak" },
    });

    const result = await resetPassword(null, makeFormData());

    expect(result).toEqual({ error: "Password too weak" });
  });
});

describe("signOut", () => {
  it("calls supabase.auth.signOut and redirects to login", async () => {
    authMock.signOut.mockResolvedValue({ error: null });

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/auth/login");

    expect(authMock.signOut).toHaveBeenCalled();
  });
});
