import { describe, it, expect } from "vitest";
import { buildSeasonStandings, MISSED_MAJOR_PENALTY, SeasonMember } from "../season";
import { TournamentId } from "../tournaments";

function member(name: string): SeasonMember {
  return { display_name: name, team_name: `Team ${name}`, team_photo: null };
}

const scores = (pairs: [string, number][]) => new Map(pairs);

describe("buildSeasonStandings", () => {
  it("sums counting scores across played majors", () => {
    const standings = buildSeasonStandings(
      [member("Daniel"), member("Jamie")],
      new Map<TournamentId, Map<string, number>>([
        ["masters", scores([["Daniel", -10], ["Jamie", -5]])],
        ["us-open", scores([["Daniel", 2], ["Jamie", -1]])],
      ]),
      new Map<TournamentId, number>([
        ["masters", -5],
        ["us-open", 2],
      ])
    );

    const daniel = standings.find((s) => s.owner === "Daniel")!;
    expect(daniel.totalScore).toBe(-8);
    expect(daniel.completedTournaments).toBe(2);
    // Unplayed majors show blank, not zero.
    const pga = daniel.tournamentResults.find((r) => r.tournamentId === "pga")!;
    expect(pga.countingScore).toBeNull();
    expect(pga.isPenalty).toBe(false);
  });

  it("charges a missed major as worst team that major + 5", () => {
    const standings = buildSeasonStandings(
      [member("Daniel"), member("Slacker")],
      new Map<TournamentId, Map<string, number>>([
        // Slacker never drafted the Masters.
        ["masters", scores([["Daniel", -10]])],
      ]),
      new Map<TournamentId, number>([["masters", -10]])
    );

    const slacker = standings.find((s) => s.owner === "Slacker")!;
    const masters = slacker.tournamentResults.find((r) => r.tournamentId === "masters")!;
    expect(masters.isPenalty).toBe(true);
    expect(masters.countingScore).toBe(-10 + MISSED_MAJOR_PENALTY);
    expect(slacker.totalScore).toBe(-5);
    // The penalty still counts as a completed major for display purposes.
    expect(slacker.completedTournaments).toBe(1);
  });

  it("ranks by total ascending with ties sharing a rank", () => {
    const standings = buildSeasonStandings(
      [member("A"), member("B"), member("C")],
      new Map<TournamentId, Map<string, number>>([
        ["masters", scores([["A", -6], ["B", -6], ["C", 4]])],
      ]),
      new Map<TournamentId, number>([["masters", 4]])
    );
    expect(standings.map((s) => [s.owner, s.rank])).toEqual([
      ["A", 1],
      ["B", 1],
      ["C", 3],
    ]);
  });
});
