import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ reviewSkill: vi.fn() }));

vi.mock("@/features/plantel/skills-actions", () => ({ reviewSkill: mocks.reviewSkill }));

import { SkillReviewRow } from "./SkillReviewRow";

const SKILL_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SkillReviewRow (ZER-163)", () => {
  it("shows the proposal and who proposed it", () => {
    render(<SkillReviewRow skillId={SKILL_ID} nombre="Cerámica" proposedBy="Lu" />);
    expect(screen.getByText("Cerámica")).toBeInTheDocument();
    expect(screen.getByText(/Propuesta por Lu/)).toBeInTheDocument();
  });

  it.each(["Aprobar", "Rechazar"])("submits %s with the skill id", async (label) => {
    mocks.reviewSkill.mockResolvedValue({ success: "ok" });
    render(<SkillReviewRow skillId={SKILL_ID} nombre="Cerámica" proposedBy="Lu" />);

    fireEvent.click(screen.getByRole("button", { name: `${label} Cerámica` }));

    await waitFor(() => expect(mocks.reviewSkill).toHaveBeenCalled());
    const fd = mocks.reviewSkill.mock.calls[0][1] as FormData;
    expect(fd.get("skillId")).toBe(SKILL_ID);
    expect(fd.get("decision")).toBe(label.toLowerCase());
  });

  it("shows the action error", async () => {
    mocks.reviewSkill.mockResolvedValue({ error: "Esa habilidad ya fue revisada" });
    render(<SkillReviewRow skillId={SKILL_ID} nombre="Cerámica" proposedBy="Lu" />);

    fireEvent.click(screen.getByRole("button", { name: "Aprobar Cerámica" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Esa habilidad ya fue revisada"),
    );
  });
});
