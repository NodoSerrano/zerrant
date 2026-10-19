import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  params: new URLSearchParams() as URLSearchParams | null,
  pathname: "/agenda" as string | null,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.params,
  usePathname: () => nav.pathname,
}));

import { ActionNotice } from "./ActionNotice";

let replaceState: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  nav.params = new URLSearchParams();
  nav.pathname = "/agenda";
  replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
});

afterEach(() => {
  replaceState.mockRestore();
});

describe("ActionNotice", () => {
  it("shows the message for a known code as a status", () => {
    nav.params = new URLSearchParams("ok=evento-creado");
    render(<ActionNotice />);
    expect(screen.getByRole("status")).toHaveTextContent("Evento creado");
  });

  it("shows nothing for an unknown code", () => {
    nav.params = new URLSearchParams("ok=Te%20hackearon");
    const { container } = render(<ActionNotice />);
    expect(container).toBeEmptyDOMElement();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("drops the code from the URL so a reload does not repeat the notice", () => {
    nav.params = new URLSearchParams("estado=abierta&ok=tarea-creada");
    nav.pathname = "/nodo/tasks";
    render(<ActionNotice />);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/nodo/tasks?estado=abierta");
  });

  it("keeps showing the notice after the code leaves the URL", () => {
    nav.params = new URLSearchParams("ok=tarea-tomada");
    const { rerender } = render(<ActionNotice />);
    nav.params = new URLSearchParams();
    rerender(<ActionNotice />);
    expect(screen.getByRole("status")).toHaveTextContent("Tomaste la tarea");
  });

  it("hides the notice when the user moves to another page", () => {
    nav.params = new URLSearchParams("ok=evento-creado");
    const { rerender } = render(<ActionNotice />);
    nav.params = new URLSearchParams();
    nav.pathname = "/plantel";
    rerender(<ActionNotice />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("can be dismissed", () => {
    nav.params = new URLSearchParams("ok=evento-creado");
    render(<ActionNotice />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the notice again when the same action repeats", () => {
    nav.params = new URLSearchParams("ok=evento-creado");
    const { rerender } = render(<ActionNotice />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    });
    nav.params = new URLSearchParams();
    rerender(<ActionNotice />);
    nav.params = new URLSearchParams("ok=evento-creado");
    rerender(<ActionNotice />);
    expect(screen.getByRole("status")).toHaveTextContent("Evento creado");
  });

  it("renders nothing outside a Next router, e.g. the precached offline page", () => {
    // useSearchParams/usePathname return null when there is no router context.
    nav.params = null;
    nav.pathname = null;
    const { container } = render(<ActionNotice />);
    expect(container).toBeEmptyDOMElement();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
