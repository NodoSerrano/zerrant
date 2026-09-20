import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  formAction: vi.fn(),
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mocks.useActionState(...args),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mocks.back, push: mocks.push }),
}));

import { NewProjectForm } from "./NewProjectForm";

function setHistoryLength(length: number) {
  Object.defineProperty(window.history, "length", { value: length, configurable: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
  setHistoryLength(2);
});

describe("NewProjectForm — header (frame 4.4)", () => {
  it("renders the title 'Nuevo proyecto'", () => {
    render(<NewProjectForm />);

    const title = screen.getByText("Nuevo proyecto");
    expect(title.className).toContain("font-display");
    expect(title.className).toContain("text-base");
  });

  it("calls router.back() when close is clicked with history", () => {
    render(<NewProjectForm />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(mocks.back).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("falls back to /nodo/projects when there is no history", () => {
    setHistoryLength(1);
    render(<NewProjectForm />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(mocks.push).toHaveBeenCalledWith("/nodo/projects");
  });

  it("renders the primary CTA label from the frame", () => {
    render(<NewProjectForm />);

    expect(screen.getByRole("button", { name: "Crear proyecto" })).toBeTruthy();
  });
});
