import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  formAction: vi.fn(),
  setRsvp: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mocks.useActionState(...args),
  };
});

vi.mock("./actions", () => ({
  setRsvp: mocks.setRsvp,
}));

import { RsvpControl } from "./RsvpControl";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
});

describe("RsvpControl", () => {
  it("renders accented labels and submits unaccented enum values", () => {
    render(<RsvpControl eventId="evt-1" currentEstado={null} />);

    const root = screen.getByTestId("rsvp-control");
    expect(root).toBeInTheDocument();
    expect(root.textContent).not.toContain("quizas");

    const voy = screen.getByRole("button", { name: "Voy" });
    const quizas = screen.getByRole("button", { name: "Quizás" });
    const no = screen.getByRole("button", { name: "No" });

    expect(voy).toHaveAttribute("name", "estado");
    expect(voy).toHaveAttribute("value", "voy");
    expect(quizas).toHaveAttribute("name", "estado");
    expect(quizas).toHaveAttribute("value", "quizas");
    expect(no).toHaveAttribute("name", "estado");
    expect(no).toHaveAttribute("value", "no");

    const eventId = document.querySelector('input[name="event_id"]');
    expect(eventId).toHaveAttribute("value", "evt-1");
    expect(document.querySelector('input[name="profile_id"]')).toBeNull();
  });

  it("marks the viewer's current answer as pressed", () => {
    render(<RsvpControl eventId="evt-1" currentEstado="quizas" />);

    expect(screen.getByRole("button", { name: "Quizás" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Voy" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "No" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a Spanish coral error from the action state", () => {
    mocks.useActionState.mockReturnValue([
      { error: "No pudimos guardar tu respuesta. Probá de nuevo." },
      mocks.formAction,
      false,
    ]);

    render(<RsvpControl eventId="evt-1" currentEstado={null} />);

    const error = screen.getByText("No pudimos guardar tu respuesta. Probá de nuevo.");
    expect(error).toHaveClass("text-coral");
    expect(error).toHaveClass("text-sm");
  });

  it("disables the options while pending", () => {
    mocks.useActionState.mockReturnValue([null, mocks.formAction, true]);

    render(<RsvpControl eventId="evt-1" currentEstado="voy" />);

    expect(screen.getByRole("button", { name: "Voy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quizás" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "No" })).toBeDisabled();
  });
});
