/** Only the authenticated Express server and trusted migration CLI know this. */
export function requireServerSecret(secret: string | undefined): void {
  const expected = process.env.CONVEX_WRITE_SECRET;
  if (!expected || !secret || secret !== expected) {
    throw new Error("Content write authorization required");
  }
}
