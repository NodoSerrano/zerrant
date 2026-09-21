import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InicioHub } from "./InicioHub";
import type { UpcomingBirthday } from "./birthdays";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: {
    alt: string;
    src: string;
    width?: number;
    height?: number;
    sizes?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={props.alt}
      src={props.src}
      width={props.width}
      height={props.height}
      sizes={props.sizes}
    />
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

const birthday = (overrides: Partial<UpcomingBirthday> = {}): UpcomingBirthday => ({
  profileId: "p1",
  displayName: "Ana García",
  avatarUrl: "https://example.supabase.co/storage/v1/object/public/avatars/a.jpg",
  fechaNacimiento: "1990-03-15",
  nextOccurrence: "2026-03-15",
  daysUntil: 5,
  ageTurning: 36,
  ...overrides,
});

describe("InicioHub a11y + perf contracts (ZER-104)", () => {
  it("exposes birthday rows as named links without duplicating the name via avatar alt", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    render(<InicioHub events={[]} birthdays={[birthday()]} />);

    const link = screen.getByRole("link", { name: /Ana García/i });
    expect(link).toHaveAttribute("href", "/plantel/p1");

    // Decorative avatar inside the named link — empty alt so AT does not hear the name twice.
    const img = link.querySelector("img");
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "48");
    expect(img).toHaveAttribute("sizes", "48px");
  });

  it("keeps null-avatar birthday rows named without initials leaking into the link name", () => {
    render(<InicioHub events={[]} birthdays={[birthday({ avatarUrl: null })]} />);

    const link = screen.getByRole("link", { name: /Ana García/i });
    expect(link).toHaveAttribute("href", "/plantel/p1");
    // Accessible name must not start with initials (AG …).
    expect(link).toHaveAccessibleName(expect.not.stringMatching(/^AG\b/));
    expect(link.querySelector("[aria-hidden='true']")).toBeTruthy();
  });

  it("keeps event cards keyboard-reachable as named links", () => {
    render(
      <InicioHub
        events={[
          {
            id: "e1",
            title: "Asamblea",
            timeLabel: "18:00 – 20:00",
            place: "Salón",
            href: "/agenda/e1",
          },
        ]}
        birthdays={[]}
      />,
    );

    const link = screen.getByRole("link", { name: /Asamblea/i });
    expect(link).toHaveAttribute("href", "/agenda/e1");
    // Decorative calendar mark must not invent an accessible name.
    expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("reserves min height on birthday cards to limit CLS vs skeleton slots", () => {
    render(<InicioHub events={[]} birthdays={[birthday({ avatarUrl: null })]} />);
    const link = screen.getByRole("link", { name: /Ana García/i });
    expect(link.className).toMatch(/min-h-\[72px\]/);
  });
});
