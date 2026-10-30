import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  state: null as { error?: string; success?: string } | null,
  pending: false,
  formAction: vi.fn(),
}));

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [mocks.state, mocks.formAction, mocks.pending],
}));

vi.mock("./actions", () => ({
  enableReapplication: vi.fn(),
}));

import { EnableReapplicationButton } from "./EnableReapplicationButton";

beforeEach(() => {
  mocks.state = null;
  mocks.pending = false;
});

describe("EnableReapplicationButton (ZER-180)", () => {
  it("submits the request id", () => {
    const { container } = render(<EnableReapplicationButton requestId="req-9" />);

    expect(screen.getByRole("button", { name: "Habilitar nueva solicitud" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(container.querySelector('input[name="requestId"]')).toHaveAttribute("value", "req-9");
  });

  it("disables itself while it runs", () => {
    mocks.pending = true;
    render(<EnableReapplicationButton requestId="req-9" />);

    expect(screen.getByRole("button", { name: "Habilitando..." })).toBeDisabled();
  });

  it("shows why it could not enable it", () => {
    mocks.state = { error: "No pudimos habilitar una nueva solicitud" };
    render(<EnableReapplicationButton requestId="req-9" />);

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos habilitar una nueva solicitud");
  });
});
