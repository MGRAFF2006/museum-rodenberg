/**
 * Data migration script: JSON flat files → Convex database.
 *
 * Usage:
 *   1. Start the Convex backend (docker compose up convex-backend)
 *   2. Generate admin key: docker compose exec convex-backend ./generate_admin_key.sh
 *   3. Add to .env.local:
 *        CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
 *        CONVEX_SELF_HOSTED_ADMIN_KEY=<key>
 *   4. Push schema first: npx convex dev (or npx convex deploy)
 *   5. Run this script: npx convex run migrate:run
 *
 * This is an "internalAction" so it runs server-side inside Convex.
 * It reads the JSON data from embedded constants (snapshot of the JSON files).
 */
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ── Embedded JSON data (snapshot at migration time) ─────────────
// We inline the data here so the migration is self-contained and
// doesn't depend on file system access from within Convex.

const EXHIBITIONS_JSON = {
  featured: "stadtgeschichte-rodenberg",
  exhibitions: {} as Record<string, Record<string, unknown>>,
};

const ARTIFACTS_JSON = {
  artifacts: {} as Record<string, Record<string, unknown>>,
};

const ASSETS_JSON = {
  assets: {} as Record<
    string,
    { id: string; name: string; alt: string; url: string; type: string }
  >,
};

// NOTE: Before running, paste the actual JSON data into the constants above,
// or use the CLI-based migration script below instead.

/**
 * CLI-based migration that uses the Convex client to insert data.
 * Run with: npx ts-node --esm scripts/migrate-to-convex.ts
 */
export const run = internalAction({
  handler: async (ctx) => {
    // This action calls mutations to insert data.
    // Since we can't import JSON from the filesystem inside a Convex action,
    // this is a placeholder. Use the CLI script instead.
    console.log(
      "Use scripts/migrate-to-convex.ts for migration. This action is a stub."
    );
    console.log("Embedded data counts:", {
      exhibitions: Object.keys(EXHIBITIONS_JSON.exhibitions).length,
      artifacts: Object.keys(ARTIFACTS_JSON.artifacts).length,
      assets: Object.keys(ASSETS_JSON.assets).length,
    });
  },
});

// Suppress unused variable warnings — these are templates to fill
void EXHIBITIONS_JSON;
void ARTIFACTS_JSON;
void ASSETS_JSON;
void internal;
