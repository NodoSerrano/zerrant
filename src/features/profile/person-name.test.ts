import { describe, expect, it } from "vitest";
import { formatPersonName } from "./person-name";

describe("formatPersonName", () => {
  it.each([
    ["  maría josé  ", "María José"],
    ["de la cruz", "De la Cruz"],
    ["DE LA CRUZ", "De la Cruz"],
    ["núñez de la cruz", "Núñez de la Cruz"],
    ["jean-luc", "Jean-Luc"],
    ["o'connor", "O'Connor"],
    ["maría", "María"],
    ["van der berg", "Van der Berg"],
    ["  a   b  ", "A B"],
  ])("formats %j → %j", (input, expected) => {
    expect(formatPersonName(input)).toBe(expected);
  });
});
