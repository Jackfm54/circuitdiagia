export function bearerToken(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("Bearer ")) return null;
  const token = value.slice(7).trim();
  return token && token !== "undefined" ? token : null;
}
export function owns(userId: string | undefined, ownerId: string): boolean {
  return Boolean(userId && userId === ownerId);
}
