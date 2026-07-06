import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getTournamentState,
  defaultTournamentTab,
  defaultMyTeamMajor,
} from "../tournament-state";
import { getTournament } from "../tournaments";

// These tests pin the clock; the 2026 majors' dates come straight from
// src/lib/tournaments.ts (U.S. Open 20260618-21, The Open 20260716-19).
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const usOpen = getTournament("us-open");
const theOpen = getTournament("the-open");

describe("getTournamentState", () => {
  it("is upcoming before the first round", () => {
    vi.setSystemTime(new Date(2026, 5, 17)); // June 17
    expect(getTournamentState(usOpen)).toBe("upcoming");
  });

  it("is in-progress during tournament days, inclusive", () => {
    vi.setSystemTime(new Date(2026, 5, 18, 8)); // June 18
    expect(getTournamentState(usOpen)).toBe("in-progress");
    vi.setSystemTime(new Date(2026, 5, 21, 20)); // final round evening
    expect(getTournamentState(usOpen)).toBe("in-progress");
  });

  it("is completed the day after the final round", () => {
    vi.setSystemTime(new Date(2026, 5, 22)); // June 22
    expect(getTournamentState(usOpen)).toBe("completed");
  });
});

describe("defaultTournamentTab", () => {
  it("opens the live major during tournament week", () => {
    vi.setSystemTime(new Date(2026, 6, 17)); // July 17, The Open round 2
    expect(defaultTournamentTab()).toBe("the-open");
  });

  it("keeps a finished major for a week, then falls back to season", () => {
    vi.setSystemTime(new Date(2026, 5, 26)); // 5 days after U.S. Open
    expect(defaultTournamentTab()).toBe("us-open");
    vi.setSystemTime(new Date(2026, 6, 5)); // two weeks after → season view
    expect(defaultTournamentTab()).toBe("season");
  });
});

describe("defaultMyTeamMajor", () => {
  it("prefers live, then most recently completed", () => {
    vi.setSystemTime(new Date(2026, 6, 17));
    expect(defaultMyTeamMajor()).toBe("the-open");
    vi.setSystemTime(new Date(2026, 6, 5)); // between majors
    expect(defaultMyTeamMajor()).toBe("us-open");
  });

  it("falls back to the first major before the season starts", () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(defaultMyTeamMajor()).toBe("masters");
    expect(theOpen && getTournamentState(theOpen)).toBe("upcoming");
  });
});
