const userIdDomain = "nur-motors.local";
const userIdPattern = /^[a-z0-9._-]+$/;

export function normalizeUserIdentifier(value: string) {
  const identifier = value.trim().toLowerCase();
  if (!identifier) throw new Error("User ID or email is required.");
  if (identifier.includes("@")) return identifier;
  if (!userIdPattern.test(identifier)) {
    throw new Error("User ID can only use letters, numbers, dots, dashes, and underscores.");
  }
  return `${identifier}@${userIdDomain}`;
}

export function displayUserIdentifier(value: string | null) {
  if (!value) return "";
  const suffix = `@${userIdDomain}`;
  return value.toLowerCase().endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}
