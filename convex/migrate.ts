import { internalAction } from "./_generated/server";

/** Retained so the former migration command fails with actionable guidance. */
export const run = internalAction({
  handler: async () => {
    throw new Error(
      "Server-side JSON migration is unavailable. Initialize a fresh local deployment with " +
      "node scripts/migrate-to-convex.mjs; see docs/content-seeding.md for credentials and prerequisites."
    );
  },
});
