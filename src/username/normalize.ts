const PROFILE_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#]*)/i;

export function normalizeUsername(raw: string): string {
  const trimmed = raw.trim();
  const profileUrl = PROFILE_URL_PATTERN.exec(trimmed);
  const value = profileUrl ? (profileUrl[1] ?? "") : trimmed;
  return value.startsWith("@") ? value.slice(1) : value;
}
