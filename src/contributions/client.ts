import { PRODUCTION_API_BASE_URL } from "../config";
import { ContributionFetchError, isContributionErrorCode } from "./types";
import type { ContributionErrorCode, ContributionModel, Day, Week } from "./types";

export const REQUEST_TIMEOUT_MS = 10_000;
export const DEFAULT_RETRY_AFTER_SECONDS = 60;

const WEEKS_PER_MODEL = 53;
const DAYS_PER_WEEK = 7;

const CODE_BY_STATUS: Record<number, ContributionErrorCode> = {
  400: "INVALID_USERNAME",
  404: "USER_NOT_FOUND",
  422: "PARSE_FAILED",
  429: "RATE_LIMITED",
  502: "UPSTREAM_UNAVAILABLE",
};

function buildUrl(username: string): string {
  const url = new URL("/api/contributions", PRODUCTION_API_BASE_URL);
  url.searchParams.set("username", username);
  return url.toString();
}

function readRetryAfterSeconds(response: Response): number {
  const parsed = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RETRY_AFTER_SECONDS;
}

function resolveErrorCode(status: number, body: unknown): ContributionErrorCode {
  const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
  if (isContributionErrorCode(code)) return code;
  return CODE_BY_STATUS[status] ?? "UPSTREAM_UNAVAILABLE";
}

function isDay(value: unknown): value is Day {
  const day = value as Day | null;
  return (
    typeof day?.date === "string" && typeof day.count === "number" && typeof day.level === "number"
  );
}

function isWeek(value: unknown): value is Week {
  const week = value as Week | null;
  return Array.isArray(week?.days) && week.days.length === DAYS_PER_WEEK && week.days.every(isDay);
}

function isContributionModel(value: unknown): value is ContributionModel {
  const model = value as ContributionModel | null;
  return (
    typeof model?.username === "string" &&
    typeof model.totalContributions === "number" &&
    Array.isArray(model.weeks) &&
    model.weeks.length === WEEKS_PER_MODEL &&
    model.weeks.every(isWeek)
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchContributions(
  username: string,
  signal: AbortSignal,
): Promise<ContributionModel> {
  let response: Response;
  try {
    response = await fetch(buildUrl(username), {
      signal: AbortSignal.any([AbortSignal.timeout(REQUEST_TIMEOUT_MS), signal]),
    });
  } catch {
    throw new ContributionFetchError("NETWORK_OR_TIMEOUT");
  }

  const body = await readJson(response);

  if (!response.ok) {
    const code = resolveErrorCode(response.status, body);
    throw new ContributionFetchError(
      code,
      code === "RATE_LIMITED" ? readRetryAfterSeconds(response) : undefined,
    );
  }

  if (!isContributionModel(body)) throw new ContributionFetchError("INVALID_RESPONSE");
  return body;
}
