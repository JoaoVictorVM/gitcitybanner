export const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}
