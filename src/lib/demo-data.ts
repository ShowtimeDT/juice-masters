import { Entry, EntryStanding, GolferScore, TournamentData } from "./types";
import { calculateStandings } from "./scoring";

/**
 * Fabricated mid-tournament standings for the marketing page demo.
 * Golfers are real (with their ESPN ids so headshots render); the teams,
 * scores, and Sunday drama are fiction. Standings are produced by the real
 * calculateStandings, so counting logic, ranks, and the missed-cut penalty
 * in the demo always match the live app.
 */

interface DemoGolfer {
  name: string;
  espnId: string;
  score: number; // relative to par through "now"
  rounds: string[]; // per-round scores relative to par
  thru: string;
  birdies: number;
  missedCut?: boolean;
}

const DEMO_GOLFERS: DemoGolfer[] = [
  { name: "Scottie Scheffler", espnId: "9478", score: -16, rounds: ["-6", "-4", "-3"], thru: "14", birdies: 19 },
  { name: "Rory McIlroy", espnId: "3470", score: -13, rounds: ["-3", "-6", "-2"], thru: "15", birdies: 17 },
  { name: "Xander Schauffele", espnId: "10140", score: -11, rounds: ["-4", "-3", "-2"], thru: "13", birdies: 15 },
  { name: "Collin Morikawa", espnId: "10592", score: -9, rounds: ["-2", "-4", "-1"], thru: "16", birdies: 14 },
  { name: "Ludvig Åberg", espnId: "4375972", score: -8, rounds: ["-5", "-1", "-2"], thru: "F", birdies: 13 },
  { name: "Viktor Hovland", espnId: "4364873", score: -7, rounds: ["-1", "-3", "-2"], thru: "12", birdies: 12 },
  { name: "Tommy Fleetwood", espnId: "5539", score: -6, rounds: ["-2", "-2", "-1"], thru: "F", birdies: 11 },
  { name: "Bryson DeChambeau", espnId: "10046", score: -5, rounds: ["-4", "+1", "-2"], thru: "11", birdies: 12 },
  { name: "Shane Lowry", espnId: "4587", score: -4, rounds: ["-1", "-2", "E"], thru: "F", birdies: 10 },
  { name: "Jordan Spieth", espnId: "5467", score: -3, rounds: ["-3", "+1", "E"], thru: "15", birdies: 11 },
  { name: "Hideki Matsuyama", espnId: "5860", score: -2, rounds: ["-2", "E", "E"], thru: "F", birdies: 9 },
  { name: "Matt Fitzpatrick", espnId: "9037", score: -1, rounds: ["E", "-1", "E"], thru: "14", birdies: 8 },
  { name: "Jon Rahm", espnId: "9780", score: 0, rounds: ["-1", "+1", "E"], thru: "F", birdies: 9 },
  { name: "Patrick Cantlay", espnId: "6007", score: 1, rounds: ["+1", "-1", "+1"], thru: "13", birdies: 7 },
  { name: "Tyrrell Hatton", espnId: "5553", score: 2, rounds: ["+2", "-1", "+1"], thru: "F", birdies: 6 },
  { name: "Wyndham Clark", espnId: "11119", score: 3, rounds: ["+1", "+1", "+1"], thru: "12", birdies: 6 },
  { name: "Sungjae Im", espnId: "11382", score: 4, rounds: ["+2", "+1", "+1"], thru: "F", birdies: 5 },
  // Missed the cut — picks up the +10 penalty and the CUT badge in the demo.
  { name: "Justin Thomas", espnId: "4848", score: 7, rounds: ["+4", "+3"], thru: "-", birdies: 4, missedCut: true },
  { name: "Keegan Bradley", espnId: "4513", score: 5, rounds: ["+3", "+1", "+1"], thru: "F", birdies: 5 },
  { name: "Justin Rose", espnId: "569", score: 6, rounds: ["+2", "+2", "+2"], thru: "10", birdies: 4 },
];

const DEMO_TEAMS: Entry[] = [
  {
    id: "demo-1",
    name: "Weekend Warriors",
    owner: "Weekend Warriors",
    golfers: [
      "Scottie Scheffler",
      "Xander Schauffele",
      "Ludvig Åberg",
      "Bryson DeChambeau",
      "Shane Lowry",
      "Hideki Matsuyama",
      "Patrick Cantlay",
      "Sungjae Im",
    ],
    tiebreakerGuess: 1480,
  },
  {
    id: "demo-2",
    name: "Dialed In",
    owner: "Dialed In",
    golfers: [
      "Rory McIlroy",
      "Collin Morikawa",
      "Viktor Hovland",
      "Jordan Spieth",
      "Matt Fitzpatrick",
      "Jon Rahm",
      "Tyrrell Hatton",
      "Justin Rose",
    ],
    tiebreakerGuess: 1395,
  },
  {
    id: "demo-3",
    name: "Mud Balls",
    owner: "Mud Balls",
    golfers: [
      "Scottie Scheffler",
      "Tommy Fleetwood",
      "Shane Lowry",
      "Jordan Spieth",
      "Jon Rahm",
      "Wyndham Clark",
      "Keegan Bradley",
      "Justin Rose",
    ],
    tiebreakerGuess: 1502,
  },
  {
    id: "demo-4",
    name: "Cart Path Only",
    owner: "Cart Path Only",
    golfers: [
      "Rory McIlroy",
      "Hideki Matsuyama",
      "Matt Fitzpatrick",
      "Patrick Cantlay",
      "Tyrrell Hatton",
      "Sungjae Im",
      "Justin Thomas",
      "Keegan Bradley",
    ],
    tiebreakerGuess: 1339,
  },
];

function toGolferScore(g: DemoGolfer): GolferScore {
  return {
    name: g.name,
    espnId: g.espnId,
    score: g.score,
    scoreDisplay: g.score === 0 ? "E" : g.score > 0 ? `+${g.score}` : `${g.score}`,
    rounds: g.rounds.map((score, i) => ({ round: i + 1, score })),
    birdies: g.birdies,
    missedCut: g.missedCut ?? false,
    position: "-",
    thru: g.thru,
  };
}

const demoTournamentData: TournamentData = {
  name: "Juice Open (Demo)",
  status: "in",
  roundStatus: "Final Round",
  totalBirdies: 1456,
  golferScores: new Map(DEMO_GOLFERS.map((g) => [g.name, toGolferScore(g)])),
};

/** Standings for the landing-page demo, scored by the real engine. */
export const DEMO_STANDINGS: EntryStanding[] = calculateStandings(
  DEMO_TEAMS,
  demoTournamentData
);

export const DEMO_TOTAL_BIRDIES = demoTournamentData.totalBirdies;
