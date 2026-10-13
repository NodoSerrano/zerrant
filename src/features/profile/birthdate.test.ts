import { describe, expect, it } from "vitest";
import { isValidBirthDate } from "./birthdate";

describe("isValidBirthDate", () => {
  it.each(["1990-01-15", "2000-02-29", "1900-01-01"])("accepts %s", (value) => {
    expect(isValidBirthDate(value)).toBe(true);
  });

  it.each([
    "ayer",
    "1990-13-45",
    "90-01-15",
    "3000-01-01",
    "1899-12-31",
    "not-a-date",
    "1990-01-15T12:00:00Z",
    "2019-02-29",
    "",
  ])("rejects %s", (value) => {
    expect(isValidBirthDate(value)).toBe(false);
  });
});
