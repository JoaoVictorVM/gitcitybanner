export interface Day {
  date: string;
  count: number;
  level: number;
}

export interface Week {
  days: Day[];
}

export interface ContributionModel {
  username: string;
  totalContributions: number;
  weeks: Week[];
}

export const CONTRIBUTION_ERROR_CODES = [
  "INVALID_USERNAME",
  "USER_NOT_FOUND",
  "PARSE_FAILED",
  "RATE_LIMITED",
  "UPSTREAM_UNAVAILABLE",
  "NETWORK_OR_TIMEOUT",
  "INVALID_RESPONSE",
] as const;

export type ContributionErrorCode = (typeof CONTRIBUTION_ERROR_CODES)[number];

export function isContributionErrorCode(value: unknown): value is ContributionErrorCode {
  return (CONTRIBUTION_ERROR_CODES as readonly unknown[]).includes(value);
}

export class ContributionFetchError extends Error {
  readonly code: ContributionErrorCode;
  readonly retryAfterSeconds: number | undefined;

  constructor(code: ContributionErrorCode, retryAfterSeconds?: number) {
    super(code);
    this.name = "ContributionFetchError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
