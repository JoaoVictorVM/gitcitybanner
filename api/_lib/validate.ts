const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

export function isValidUsername(input: string | null | undefined): boolean {
  if (typeof input !== "string") return false;
  return USERNAME_PATTERN.test(input);
}
