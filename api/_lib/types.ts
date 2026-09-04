export interface Day {
  date: string;
  count: number;
  level: number;
}

export interface Week {
  days: Day[];
}

export interface ContributionData {
  username: string;
  totalContributions: number;
  weeks: Week[];
}

export const ERROR_CODES = [
  "INVALID_USERNAME",
  "USER_NOT_FOUND",
  "PARSE_FAILED",
  "RATE_LIMITED",
  "UPSTREAM_UNAVAILABLE",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ErrorBody {
  error: { code: ErrorCode; message: string };
}
