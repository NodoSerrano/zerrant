import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemberConfirmedNotice } from "./MemberConfirmedNotice";

describe("MemberConfirmedNotice", () => {
  it("tells the new member they were confirmed, not only via a tier badge", () => {
    render(<MemberConfirmedNotice />);

    expect(screen.getByRole("heading", { name: "Ya sos miembro del Nodo" })).toBeInTheDocument();
    expect(screen.getByText(/tareas, proyectos/i)).toBeInTheDocument();
  });
});
