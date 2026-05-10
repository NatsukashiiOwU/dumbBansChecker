export type BanEntry = {
  user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
  };
  reason: string | null;
};

export type ParsedItem = {
  raw: string;
  id?: string;
  username?: string;
};

export type MatchType = "exact_id" | "username" | "fuzzy" | null;

export type BatchResult = {
  input: string;
  found: BanEntry | null;
  matchType: MatchType;
};
