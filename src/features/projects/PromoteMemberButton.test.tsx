import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PromoteMemberButton } from "./PromoteMemberButton";

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [null, vi.fn(), false],
}));

vi.mock("./actions", () => ({
  promoteProjectMember: vi.fn(),
}));

describe("PromoteMemberButton", () => {
  it("renders Designar admin with hidden projectId and profileId", () => {
    const { container } = render(<PromoteMemberButton projectId="proj-1" profileId="member-2" />);

    expect(screen.getByRole("button", { name: "Designar admin" })).toBeInTheDocument();
    const projectInput = container.querySelector('input[name="projectId"]');
    const profileInput = container.querySelector('input[name="profileId"]');
    expect(projectInput).toHaveAttribute("value", "proj-1");
    expect(profileInput).toHaveAttribute("value", "member-2");
  });
});
