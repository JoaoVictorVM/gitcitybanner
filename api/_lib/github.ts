const UPSTREAM_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 500;

export interface UpstreamResult {
  status: number;
  body: string;
}

function contributionsUrl(username: string): string {
  return `https://github.com/users/${encodeURIComponent(username)}/contributions`;
}

async function attempt(username: string): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(contributionsUrl(username), {
      signal: controller.signal,
      headers: { Accept: "text/html", "User-Agent": "gitcitybanner" },
    });
    const body = response.ok ? await response.text() : "";
    return { status: response.status, body };
  } catch {
    return { status: 0, body: "" };
  } finally {
    clearTimeout(timeout);
  }
}

function shouldRetry(result: UpstreamResult): boolean {
  return result.status === 0 || result.status >= 500;
}

export async function fetchContributionsSvg(username: string): Promise<UpstreamResult> {
  const first = await attempt(username);
  if (!shouldRetry(first)) return first;
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  return attempt(username);
}
