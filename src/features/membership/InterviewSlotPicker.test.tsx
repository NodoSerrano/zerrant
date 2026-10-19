import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actionState = vi.hoisted(() => ({
  value: null as { error?: string; success?: string } | null,
}));

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [actionState.value, vi.fn(), false],
}));

import { InterviewSlotPicker } from "./InterviewSlotPicker";

const SLOT = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  starts_at: "2026-10-07T18:00:00.000Z",
  ends_at: "2026-10-07T18:30:00.000Z",
};

beforeEach(() => {
  actionState.value = null;
});

describe("InterviewSlotPicker", () => {
  it("announces a confirmed booking as a status (ZER-177)", () => {
    actionState.value = { success: "Reservaste tu entrevista" };
    render(<InterviewSlotPicker slots={[SLOT]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Reservaste tu entrevista");
  });

  it("announces a failed booking as an alert (ZER-177)", () => {
    actionState.value = { error: "Ese horario ya no está libre" };
    render(<InterviewSlotPicker slots={[SLOT]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Ese horario ya no está libre");
  });

  it("lists free slots and a reserve CTA", () => {
    render(
      <InterviewSlotPicker
        slots={[
          {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            starts_at: "2026-10-07T18:00:00.000Z",
            ends_at: "2026-10-07T18:30:00.000Z",
          },
        ]}
      />,
    );
    expect(screen.getByRole("radio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reservar horario" })).toBeInTheDocument();
  });

  it("explains an empty catalog", () => {
    render(<InterviewSlotPicker slots={[]} />);
    expect(screen.getByText(/Todavía no hay horarios libres/)).toBeInTheDocument();
  });
});
