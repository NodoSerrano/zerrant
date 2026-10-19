import { describe, expect, it } from "vitest";
import { ACTION_NOTICE_PARAM, actionNoticeMessage, withActionNotice } from "./action-notice";

describe("withActionNotice", () => {
  it("appends the notice code to a bare path", () => {
    expect(withActionNotice("/agenda", "evento-creado")).toBe("/agenda?ok=evento-creado");
  });

  it("keeps existing query params", () => {
    expect(withActionNotice("/nodo/tasks?estado=abierta", "tarea-creada")).toBe(
      "/nodo/tasks?estado=abierta&ok=tarea-creada",
    );
  });

  it("uses the shared param name", () => {
    expect(ACTION_NOTICE_PARAM).toBe("ok");
  });
});

describe("actionNoticeMessage", () => {
  it.each([
    ["proyecto-creado", "Proyecto creado"],
    ["evento-actualizado", "Cambios del evento guardados"],
    ["tarea-tomada", "Tomaste la tarea"],
  ])("maps %s to its message", (code, message) => {
    expect(actionNoticeMessage(code)).toBe(message);
  });

  it("ignores unknown codes, so the URL cannot inject arbitrary text", () => {
    expect(actionNoticeMessage("<script>alert(1)</script>")).toBeNull();
    expect(actionNoticeMessage("Hackeado")).toBeNull();
    expect(actionNoticeMessage("toString")).toBeNull();
    expect(actionNoticeMessage(null)).toBeNull();
    expect(actionNoticeMessage("")).toBeNull();
  });
});
