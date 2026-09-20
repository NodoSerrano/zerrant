import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  formAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mocks.useActionState(...args),
  };
});

import { EventDeleteControl } from "./EventDeleteControl";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
});

describe("EventDeleteControl", () => {
  it("requires confirmation before submitting the destructive action", () => {
    const { container } = render(<EventDeleteControl eventId="evt-1" />);

    expect(screen.getByRole("button", { name: /Eliminar evento/i })).toBeTruthy();
    expect(container.querySelector('input[name="eventId"]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Sí, eliminar" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Eliminar evento/i }));

    expect(screen.getByRole("dialog", { name: "Confirmar eliminación" })).toBeTruthy();
    expect(screen.getByText(/¿Eliminar este evento\?/)).toBeTruthy();
    expect(container.querySelector('input[name="eventId"]')).toHaveValue("evt-1");
    expect(screen.getByRole("button", { name: "Sí, eliminar" })).toHaveAttribute("type", "submit");
  });

  it("backs out of confirmation without submitting", () => {
    render(<EventDeleteControl eventId="evt-1" />);

    fireEvent.click(screen.getByRole("button", { name: /Eliminar evento/i }));
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /Eliminar evento/i })).toBeTruthy();
  });
});
