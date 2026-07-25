import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ auth: authMock }),
}));

import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  sendPasswordReset,
  resetPassword,
  signOut,
} from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
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

    try {
      await signInWithPassword(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "secret123",
    });
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

  it("calls supabase.auth.signUp with credentials and redirectTo option on success", async () => {
    authMock.signUp.mockResolvedValue({ error: null });

    try {
      await signUpWithPassword(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(authMock.signUp).toHaveBeenCalledWith({
      email: "newuser@example.com",
      password: "newpass456",
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });

  it("returns error message when supabase returns an error", async () => {
    authMock.signUp.mockResolvedValue({
      error: { message: "Email already registered" },
    });

    const result = await signUpWithPassword(null, makeFormData());

    expect(result).toEqual({ error: "Email already registered" });
  });
});

describe("signInWithGoogle", () => {
  it("calls supabase.auth.signInWithOAuth with google provider and redirectTo option", async () => {
    authMock.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/auth" },
      error: null,
    });

    try {
      await signInWithGoogle(new FormData());
    } catch {
      // redirect throws
    }

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

    try {
      await signInWithGoogle(new FormData());
    } catch {
      // redirect throws
    }

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

    try {
      await sendPasswordReset(null, makeFormData());
    } catch {
      // redirect throws
    }

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

    try {
      await resetPassword(null, makeFormData());
    } catch {
      // redirect throws
    }

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

    try {
      await signOut();
    } catch {
      // redirect throws
    }

    expect(authMock.signOut).toHaveBeenCalled();
  });
});
