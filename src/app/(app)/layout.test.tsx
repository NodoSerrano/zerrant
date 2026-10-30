import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ActionNotice", () => ({
  ActionNotice: () => <div data-testid="action-notice" />,
}));

vi.mock("@/components/TabBarClient", () => ({
  TabBarClient: ({ showActividad }: { showActividad?: boolean }) => (
    <nav
      data-testid="tab-bar"
      aria-label="TabBar"
      data-actividad={String(Boolean(showActividad))}
    />
  ),
}));

const gate = vi.hoisted(() => ({ getOnboardingGateProfile: vi.fn() }));
vi.mock("@/features/profile/onboarding-gate-server", () => gate);

function viewerTier(tier: string | null) {
  gate.getOnboardingGateProfile.mockResolvedValue({
    profile: tier ? { tier } : null,
    error: null,
    userId: tier ? "u1" : null,
  });
}

beforeEach(() => {
  viewerTier("member");
});

// TabBarPin is a client component; keep real implementation so portal contract is tested.

import AppLayout from "./layout";

describe("App shell layout (navigation destinations)", () => {
  it("renders TabBar for destinations that keep bottom navigation", async () => {
    render(await AppLayout({ children: <div>hub content</div> }));

    expect(screen.getByTestId("tab-bar")).toBeInTheDocument();
    expect(screen.getByText("hub content")).toBeInTheDocument();
  });

  it("does not render the fake phone status bar (device chrome, not product UI)", async () => {
    render(await AppLayout({ children: <div>hub content</div> }));

    expect(screen.queryByText("9:41")).not.toBeInTheDocument();
  });

  it("uses post-StatusBar hub padding [20,20,20,20] (sides/bottom match Pencil; top raised after ZER-66)", async () => {
    const { container } = render(await AppLayout({ children: <div>hub content</div> }));

    const content = container.querySelector(".max-w-lg");
    // Pencil hub wrappers still encode top 8 under a fake StatusBar; without it
    // the shell uses 20 top so content is not flush with the viewport edge.
    expect(content?.className).toContain("pt-5");
    expect(content?.className).toContain("px-5");
    expect(content?.className).toContain("pb-5");
    expect(content?.className).not.toContain("pt-2");
  });

  it("pins TabBar to the viewport bottom and reserves its height so lists do not sit under it", async () => {
    const { container } = render(await AppLayout({ children: <div>hub content</div> }));

    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toMatch(/min-h-(full|dvh|screen)/);

    const pin = screen.getByTestId("tab-bar-pin");
    expect(pin.className).toMatch(/fixed/);
    expect(pin.className).toMatch(/bottom-0/);
    expect(pin).toContainElement(screen.getByTestId("tab-bar"));

    // Pencil TabBar outer frame: pt 21 + pill 62 + pb 21 = 104px.
    const spacer = container.querySelector('[data-testid="tab-bar-spacer"]');
    expect(spacer).toBeInTheDocument();
    expect(spacer?.className).toContain("h-[104px]");
  });

  it("portals the TabBar pin to document.body so fixed anchors to the viewport (ZER-70)", async () => {
    // A transformed ancestor would make position:fixed behave like absolute
    // against that box — the failure mode on /nodo/tasks where the bar sat
    // at the top while body-level fixed (Next dev badge) still worked.
    const trap = document.createElement("div");
    trap.style.transform = "translateX(0)";
    document.body.appendChild(trap);

    const { unmount } = render(await AppLayout({ children: <div>hub content</div> }), {
      container: trap,
    });

    const pin = screen.getByTestId("tab-bar-pin");
    expect(pin.parentElement).toBe(document.body);
    expect(trap.contains(pin)).toBe(false);
    expect(pin.className).toMatch(/fixed/);
    expect(pin.className).toMatch(/bottom-0/);

    unmount();
    trap.remove();
  });

  it("hosts the post-redirect success notice above the page content (ZER-177)", async () => {
    render(await AppLayout({ children: <p>contenido</p> }));
    const notice = screen.getByTestId("action-notice");
    expect(notice.compareDocumentPosition(screen.getByText("contenido"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("shows the Actividad tab to members (ZER-206)", async () => {
    viewerTier("member");
    render(await AppLayout({ children: <div>hub content</div> }));
    expect(screen.getByTestId("tab-bar")).toHaveAttribute("data-actividad", "true");
  });

  it.each([["tourist"], [null]])(
    "hides the Actividad tab when the tier is %s (members-only)",
    async (tier) => {
      viewerTier(tier);
      render(await AppLayout({ children: <div>hub content</div> }));
      expect(screen.getByTestId("tab-bar")).toHaveAttribute("data-actividad", "false");
    },
  );
});
