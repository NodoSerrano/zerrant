import { describe, expect, it } from "vitest";
import { groupAttendance, RSVP_LABELS } from "./attendance";
import type { EventAttendee } from "./types";

function attendee(
  overrides: Partial<EventAttendee> & Pick<EventAttendee, "profileId" | "estado">,
): EventAttendee {
  return {
    name: overrides.name ?? overrides.profileId,
    avatarUrl: overrides.avatarUrl ?? null,
    ...overrides,
  };
}

describe("RSVP_LABELS", () => {
  it("maps unaccented stored values to accented UI labels", () => {
    expect(RSVP_LABELS.voy).toBe("Voy");
    expect(RSVP_LABELS.quizas).toBe("Quizás");
    expect(RSVP_LABELS.no).toBe("No");
    expect(Object.keys(RSVP_LABELS)).toEqual(["voy", "quizas", "no"]);
    expect("quizás" in RSVP_LABELS).toBe(false);
  });
});

describe("groupAttendance", () => {
  it("groups a mixed list into voy / quizas / no in stable order", () => {
    const rows = [
      attendee({ profileId: "no-1", estado: "no", name: "Nia" }),
      attendee({ profileId: "voy-1", estado: "voy", name: "Valen" }),
      attendee({ profileId: "quizas-1", estado: "quizas", name: "Quimey" }),
      attendee({ profileId: "voy-2", estado: "voy", name: "Vera" }),
    ];

    const groups = groupAttendance(rows);

    expect(groups.map((g) => g.estado)).toEqual(["voy", "quizas", "no"]);
    expect(groups.map((g) => g.label)).toEqual(["Voy", "Quizás", "No"]);
    expect(groups[0]!.attendees.map((a) => a.profileId)).toEqual(["voy-1", "voy-2"]);
    expect(groups[1]!.attendees.map((a) => a.profileId)).toEqual(["quizas-1"]);
    expect(groups[2]!.attendees.map((a) => a.profileId)).toEqual(["no-1"]);
  });

  it("keeps empty groups as empty arrays when some estados have no rows", () => {
    const groups = groupAttendance([
      attendee({ profileId: "voy-1", estado: "voy", name: "Valen" }),
    ]);

    expect(groups).toHaveLength(3);
    expect(groups[0]!.attendees).toHaveLength(1);
    expect(groups[1]!.estado).toBe("quizas");
    expect(groups[1]!.attendees).toEqual([]);
    expect(groups[2]!.estado).toBe("no");
    expect(groups[2]!.attendees).toEqual([]);
  });

  it("returns three empty groups when there are no RSVP rows", () => {
    const groups = groupAttendance([]);
    expect(groups).toEqual([
      { estado: "voy", label: "Voy", attendees: [] },
      { estado: "quizas", label: "Quizás", attendees: [] },
      { estado: "no", label: "No", attendees: [] },
    ]);
  });

  it("never stores or compares the accented quizás form", () => {
    const quizas = groupAttendance([
      attendee({ profileId: "q1", estado: "quizas", name: "Quimey" }),
    ])[1]!;

    expect(quizas.estado).toBe("quizas");
    expect(quizas.estado).not.toMatch(/á/);
    expect(quizas.label).toBe("Quizás");
    expect(quizas.label).toMatch(/á/);
  });
});
