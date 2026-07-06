import { describe, it, expect } from "vitest";
import { calculateStandings, getGolferScore } from "../scoring";
import { Entry, GolferScore, TournamentData } from "../types";

/** A golfer score with sensible defaults, overridable per test. */
function golfer(name: string, overrides: Partial<GolferScore> = {}): GolferScore {
  return {
    name,
    espnId: "1",
    score: 0,
    scoreDisplay: "E",
    rounds: [],
    birdies: 0,
    missedCut: false,
    position: "T10",
    thru: "F",
    ...overrides,
  };
}

function tournamentData(golfers: GolferScore[]): TournamentData {
  return {
    name: "Test Major",
    status: "in",
    roundStatus: "Round 4",
    totalBirdies: 100,
    golferScores: new Map(golfers.map((g) => [g.name, g])),
  };
}

function entry(owner: string, golfers: string[], id = owner): Entry {
  return { id, name: `${owner}'s team`, owner, golfers, tiebreakerGuess: 0 };
}

// 8 golfers scoring -8..-1: best 5 are -8,-7,-6,-5,-4 → counting -30.
const FIELD = Array.from({ length: 8 }, (_, i) => golfer(`Golfer ${i}`, { score: -8 + i }));

describe("calculateStandings", () => {
  it("counts the best 5 of 8 golfers", () => {
    const data = tournamentData(FIELD);
    const [standing] = calculateStandings(
      [entry("Daniel", FIELD.map((g) => g.name))],
      data
    );
    expect(standing.countingScore).toBe(-30);
    const counting = standing.golferScores.filter((g) => g.isCounting);
    expect(counting).toHaveLength(5);
    expect(counting.map((g) => g.score).sort((a, b) => a - b)).toEqual([-8, -7, -6, -5, -4]);
  });

  it("adds the +10 missed-cut penalty before choosing counting golfers", () => {
    // A -8 golfer who missed the cut becomes +2 effective, so he must NOT count
    // ahead of the -1 golfer who made the weekend.
    const field = [
      golfer("Cut Star", { score: -8, missedCut: true }),
      ...Array.from({ length: 7 }, (_, i) => golfer(`Grinder ${i}`, { score: -1 })),
    ];
    const [standing] = calculateStandings(
      [entry("Daniel", field.map((g) => g.name))],
      tournamentData(field)
    );
    const cutStar = standing.golferScores.find((g) => g.name === "Cut Star")!;
    expect(cutStar.effectiveScore).toBe(2); // -8 + 10
    expect(cutStar.isCounting).toBe(false);
    expect(standing.countingScore).toBe(-5); // five grinders at -1
  });

  it("ranks entries ascending and gives ties the same rank", () => {
    const field = [
      golfer("A", { score: -5 }),
      golfer("B", { score: -5 }),
      golfer("C", { score: 3 }),
    ];
    // Entries pick a single golfer 8 times (allowed by scoring, simplest tie setup).
    const standings = calculateStandings(
      [
        entry("First", Array(8).fill("A")),
        entry("Tied", Array(8).fill("B")),
        entry("Last", Array(8).fill("C")),
      ],
      tournamentData(field)
    );
    expect(standings.map((s) => [s.entry.owner, s.rank])).toEqual([
      ["First", 1],
      ["Tied", 1],
      ["Last", 3],
    ]);
  });
});

describe("getGolferScore name matching", () => {
  const scores = new Map<string, GolferScore>(
    [
      golfer("Ludvig Åberg", { score: -4 }),
      golfer("J.J. Spaun", { score: -2 }),
      golfer("Chris Gotterup", { score: -1 }),
      golfer("Tom Kim", { score: 1 }),
      golfer("Si Woo Kim", { score: 2 }),
      golfer("Sung Kim", { score: 3 }),
    ].map((g) => [g.name, g])
  );

  it("matches exact ESPN names", () => {
    expect(getGolferScore("Tom Kim", scores).score).toBe(1);
  });

  it("matches through explicit aliases (Joohyung Kim → Tom Kim)", () => {
    expect(getGolferScore("Joohyung Kim", scores).score).toBe(1);
  });

  it("matches ignoring accents and punctuation", () => {
    expect(getGolferScore("Ludvig Aberg", scores).score).toBe(-4);
    expect(getGolferScore("JJ Spaun", scores).score).toBe(-2);
  });

  it("falls back to last name + initial only when unambiguous", () => {
    expect(getGolferScore("Christopher Gotterup", scores).score).toBe(-1);
    // "S... Kim" is ambiguous (Si Woo Kim, Sung Kim) → placeholder scoring Even.
    const ambiguous = getGolferScore("Seonghyeon Kim", scores);
    expect(ambiguous.score).toBe(0);
    expect(ambiguous.scoreDisplay).toBe("-");
  });

  it("returns an Even placeholder for unknown golfers", () => {
    const unknown = getGolferScore("Nobody Atall", scores);
    expect(unknown.score).toBe(0);
    expect(unknown.missedCut).toBe(false);
    expect(unknown.position).toBe("-");
  });
});
