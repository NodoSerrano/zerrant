import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  // ZER-211: saving can take a few seconds. The tapped answer has to show as
  // chosen right away, not leave every option greyed out as if nothing happened.
  it("marks the tapped answer while it is being saved", () => {
    const { rerender } = render(<RsvpControl eventId="evt-1" currentEstado={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Voy" }));

    mocks.useActionState.mockReturnValue([null, mocks.formAction, true]);
    rerender(<RsvpControl eventId="evt-1" currentEstado={null} />);

    expect(screen.getByRole("button", { name: "Voy" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "No" })).toHaveAttribute("aria-pressed", "false");
  });

  it("goes back to the saved answer once the save ends", async () => {
    // Run the real guarded action so its lock is released when the save fails.
    mocks.setRsvp.mockResolvedValue({ error: "No pudimos guardar tu respuesta." });
    mocks.useActionState.mockImplementation((action: Function, initial: unknown) => [
      initial,
      (formData: FormData) => action(initial, formData),
      false,
    ]);
    render(<RsvpControl eventId="evt-1" currentEstado="quizas" />);

    fireEvent.click(screen.getByRole("button", { name: "Voy" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Quizás" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    expect(screen.getByRole("button", { name: "Voy" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a chosen No in red, not in the neutral grey of an unchosen option", () => {
    render(<RsvpControl eventId="evt-1" currentEstado="no" />);

    const no = screen.getByRole("button", { name: "No" });
    expect(no.className).toContain("bg-coral/20");
    expect(no.className).toContain("text-on-coral-tint");
    // On touch screens hover sticks after the tap: it must not grey it out again.
    expect(no.className).toContain("hover:bg-coral/20");
  });
});
