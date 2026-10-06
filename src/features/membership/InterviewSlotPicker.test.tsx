import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [null, vi.fn(), false],
}));

import { InterviewSlotPicker } from "./InterviewSlotPicker";

describe("InterviewSlotPicker", () => {
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
