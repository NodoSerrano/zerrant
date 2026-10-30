import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.hoisted(() => vi.fn((_key?: string) => null as string | null));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

const mockSignInWithPassword = vi.hoisted(() => vi.fn());
const mockSignInWithGoogle = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/actions", () => ({
  signInWithPassword: mockSignInWithPassword,
  signInWithGoogle: mockSignInWithGoogle,
}));

import LoginPage from "@/app/auth/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(() => null);
    mockSignInWithPassword.mockReset();
    mockSignInWithGoogle.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders brand hero with Mountain icon, title, and subtitle", () => {
    render(<LoginPage />);
    expect(screen.getByText("Nodo Serrano")).toBeInTheDocument();
    expect(screen.getByText("El backoffice de la comunidad")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("renders email and password inputs in order", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    const pwInput = document.querySelector("input[type='password']");
    expect(pwInput).toBeInTheDocument();
    const formFields = document.querySelectorAll("input");
    expect(formFields[0].getAttribute("name")).toBe("email");
  });

  it("renders forgot password link", () => {
    render(<LoginPage />);
    const forgotLink = screen.getByText(/¿Olvidaste tu contraseña/);
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink.closest("a")).toHaveAttribute("href", "/auth/recovery");
  });

  it("renders PrimaryButton with text Ingresar", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("hides Google CTA and orphan divider while Google auth is disabled", () => {
    render(<LoginPage />);
    expect(screen.queryByRole("button", { name: /Continuar con Google/i })).not.toBeInTheDocument();
    expect(screen.queryByText("o")).not.toBeInTheDocument();
  });

  it("shows Google CTA and divider when Google auth is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");
    vi.resetModules();
    const { default: EnabledLoginPage } = await import("@/app/auth/login/page");
    render(<EnabledLoginPage />);
    expect(screen.getByRole("button", { name: /Continuar con Google/i })).toBeInTheDocument();
    expect(screen.getByText("o")).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("renders footer with ¿Primera vez? and Creá tu cuenta link", () => {
    render(<LoginPage />);
    expect(screen.getByText(/¿Primera vez\?/)).toBeInTheDocument();
    const cuentaLink = screen.getByText("Creá tu cuenta");
    expect(cuentaLink).toBeInTheDocument();
    expect(cuentaLink.closest("a")).toHaveAttribute("href", "/auth/signup");
  });

  it("shows the git stamp when the build baked channel, branch and sha", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_CHANNEL", "prod");
    vi.stubEnv("NEXT_PUBLIC_GIT_REF", "main");
    vi.stubEnv("NEXT_PUBLIC_GIT_SHA", "694ef9b");
    vi.resetModules();
    const { default: StampedLoginPage } = await import("@/app/auth/login/page");
    render(<StampedLoginPage />);
    expect(screen.getByTestId("build-stamp")).toHaveTextContent("prod · main · 694ef9b");
    expect(screen.queryByRole("button", { name: "694ef9b" })).not.toBeInTheDocument();
  });

  it("opens merged PR history when the test sha is clicked", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_CHANNEL", "test");
    vi.stubEnv("NEXT_PUBLIC_GIT_REF", "develop");
    vi.stubEnv("NEXT_PUBLIC_GIT_SHA", "7151799");
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/zerrant-test");
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        versions: [
          {
            sha: "7151799",
            title: "feat(auth): stamp channel, branch and sha on the login",
            pr: 124,
            url: "https://github.com/NodoSerrano/zerrant/pull/124",
            date: "2026-10-16T02:38:33Z",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { default: StampedLoginPage } = await import("@/app/auth/login/page");
    render(<StampedLoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "7151799" }));
    const link = await screen.findByRole("link", { name: "PR #124" });
    expect(link).toHaveAttribute("href", "https://github.com/NodoSerrano/zerrant/pull/124");
    expect(fetchMock).toHaveBeenCalledWith("/zerrant-test/api/deploy-history");
  });

  it("shows error message after failed submission", async () => {
    mockSignInWithPassword.mockReturnValue({ error: "Credenciales inválidas" });
    render(<LoginPage />);
    const form = document.querySelector("form");
    fireEvent.submit(form!);
    expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument();
  });

  it("keeps the typed email after a failed submission", async () => {
    mockSignInWithPassword.mockReturnValue({ error: "Credenciales inválidas" });
    render(<LoginPage />);
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.submit(document.querySelector("form")!);
    expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument();
    expect(emailInput.value).toBe("user@test.com");
  });

  it("reveals the password only while the eye button is held down", () => {
    render(<LoginPage />);
    const pwInput = screen.getByLabelText("Contraseña");
    const eye = screen.getByRole("button", { name: /ver la contraseña/i });
    expect(pwInput).toHaveAttribute("type", "password");
    fireEvent.pointerDown(eye);
    expect(pwInput).toHaveAttribute("type", "text");
    fireEvent.pointerUp(eye);
    expect(pwInput).toHaveAttribute("type", "password");
  });

  it("keeps the password visible if another key is released while Space is held", () => {
    render(<LoginPage />);
    const pwInput = screen.getByLabelText("Contraseña");
    const eye = screen.getByRole("button", { name: /ver la contraseña/i });
    fireEvent.keyDown(eye, { key: " " });
    expect(pwInput).toHaveAttribute("type", "text");
    fireEvent.keyUp(eye, { key: "a" });
    expect(pwInput).toHaveAttribute("type", "text");
    fireEvent.keyUp(eye, { key: " " });
    expect(pwInput).toHaveAttribute("type", "password");
  });

  it("hides the eye icon from screen readers", () => {
    render(<LoginPage />);
    const eye = screen.getByRole("button", { name: /ver la contraseña/i });
    expect(eye.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    fireEvent.pointerDown(eye);
    expect(eye.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("reveals the password while Space is held and hides it on release", () => {
    render(<LoginPage />);
    const pwInput = screen.getByLabelText("Contraseña");
    const eye = screen.getByRole("button", { name: /ver la contraseña/i });
    fireEvent.keyDown(eye, { key: " " });
    expect(pwInput).toHaveAttribute("type", "text");
    fireEvent.keyUp(eye, { key: " " });
    expect(pwInput).toHaveAttribute("type", "password");
  });

  it("reveals the password while Enter is held and hides it on release", () => {
    render(<LoginPage />);
    const pwInput = screen.getByLabelText("Contraseña");
    const eye = screen.getByRole("button", { name: /ver la contraseña/i });
    fireEvent.keyDown(eye, { key: "Enter" });
    expect(pwInput).toHaveAttribute("type", "text");
    fireEvent.keyUp(eye, { key: "Enter" });
    expect(pwInput).toHaveAttribute("type", "password");
  });

  it("hides the password when the pointer leaves the eye button", () => {
    render(<LoginPage />);
    const pwInput = screen.getByLabelText("Contraseña");
    const eye = screen.getByRole("button", { name: /ver la contraseña/i });
    fireEvent.pointerDown(eye);
    expect(pwInput).toHaveAttribute("type", "text");
    fireEvent.pointerLeave(eye);
    expect(pwInput).toHaveAttribute("type", "password");
  });

  it("hides the password when the pointer gesture is cancelled", () => {
    render(<LoginPage />);
    const pwInput = screen.getByLabelText("Contraseña");
    const eye = screen.getByRole("button", { name: /ver la contraseña/i });
    fireEvent.pointerDown(eye);
    expect(pwInput).toHaveAttribute("type", "text");
    fireEvent.pointerCancel(eye);
    expect(pwInput).toHaveAttribute("type", "password");
  });

  it("renders callback failure from searchParams.error", () => {
    mockGet.mockImplementation((key?: string) => (key === "error" ? "auth_callback_failed" : null));
    render(<LoginPage />);
    expect(screen.getByText(/No pudimos confirmar el enlace/i)).toBeInTheDocument();
  });

  it("renders otp_expired from searchParams.error", () => {
    mockGet.mockImplementation((key?: string) => (key === "error" ? "otp_expired" : null));
    render(<LoginPage />);
    expect(screen.getByText(/El enlace expiró o ya se usó/i)).toBeInTheDocument();
  });
});

describe("LoginPage autofill (ZER-176)", () => {
  it("lets the phone's password manager fill the saved account", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("autoComplete", "email");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("autoComplete", "current-password");
  });
});
