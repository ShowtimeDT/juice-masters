export interface Draft {
  id: string;
  tournament_id: string;
  name: string;
  status: "open" | "closed" | "locked";
  created_at: string;
}

export interface DraftTier {
  id: number;
  draft_id: string;
  tier_number: number;
  name: string;
}

export interface DraftGolfer {
  id: number;
  draft_id: string;
  tier_number: number;
  name: string;
  espn_id: string;
}

export interface DraftPick {
  id: number;
  draft_id: string;
  owner: string;
  user_id?: string;
  tier_number: number;
  golfer_name: string;
  tiebreaker_guess: number | null;
  picked_at: string;
}

export interface DraftMember {
  id: number;
  draft_id: string;
  name: string;
  user_id?: string;
}

export interface PickCount {
  owner: string;
  count: string;
}

export interface DraftData {
  draft: Draft;
  tiers: DraftTier[];
  golfers: DraftGolfer[];
  picks: DraftPick[];
  members: DraftMember[];
  pickCounts?: PickCount[];
}
