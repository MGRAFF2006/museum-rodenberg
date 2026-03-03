#!/usr/bin/env node
/**
 * Data migration: JSON flat files → Convex database.
 *
 * Prerequisites:
 *   1. Convex backend running (docker compose up convex-backend)
 *   2. Admin key generated and saved in .env.local
 *   3. Schema pushed: npx convex dev (at least once)
 *
 * Usage:
 *   node scripts/migrate-to-convex.mjs
 *
 * This script reads the three JSON files (exhibitions, artifacts, assets)
 * and inserts them into Convex using the ConvexHttpClient.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Load environment ─────────────────────────────────────────────
// Try .env.local first, then .env
function loadEnv(file) {
  const envPath = path.join(ROOT, file);
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip quotes
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const envLocal = loadEnv(".env.local");
const envFile = loadEnv(".env");
const CONVEX_URL = envLocal.CONVEX_SELF_HOSTED_URL || envFile.CONVEX_SELF_HOSTED_URL;
const ADMIN_KEY = envLocal.CONVEX_SELF_HOSTED_ADMIN_KEY || envFile.CONVEX_SELF_HOSTED_ADMIN_KEY;

if (!CONVEX_URL) {
  console.error("ERROR: CONVEX_SELF_HOSTED_URL not set in .env.local or .env");
  process.exit(1);
}

console.log(`Connecting to Convex at ${CONVEX_URL}`);
const client = new ConvexHttpClient(CONVEX_URL);
if (ADMIN_KEY) {
  client.setAdminAuth(ADMIN_KEY);
}

// ── Load JSON data ───────────────────────────────────────────────
const exhibitions = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/content/exhibitions.json"), "utf-8")
);
const artifacts = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/content/artifacts.json"), "utf-8")
);
const assets = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/content/assets.json"), "utf-8")
);

console.log("Loaded JSON data:");
console.log(`  Exhibitions: ${Object.keys(exhibitions.exhibitions).length}`);
console.log(`  Artifacts:   ${Object.keys(artifacts.artifacts).length}`);
console.log(`  Assets:      ${Object.keys(assets.assets).length}`);

// ── Migrate assets ───────────────────────────────────────────────
console.log("\n--- Migrating assets ---");
for (const [id, asset] of Object.entries(assets.assets)) {
  console.log(`  Asset: ${id}`);
  await client.mutation(api.assets.save, {
    assetId: id,
    name: asset.name || id,
    alt: asset.alt || id,
    url: asset.url,
    type: asset.type || "other",
  });
}
console.log(`  Done: ${Object.keys(assets.assets).length} assets migrated.`);

// ── Migrate exhibitions ──────────────────────────────────────────
console.log("\n--- Migrating exhibitions ---");
for (const [slug, ex] of Object.entries(exhibitions.exhibitions)) {
  console.log(`  Exhibition: ${slug}`);

  // Build translation array
  const translations = [];
  if (ex.translations) {
    for (const [lang, t] of Object.entries(ex.translations)) {
      translations.push({
        language: lang,
        title: t.title || "",
        subtitle: t.subtitle || undefined,
        description: t.description || "",
        detailedContent: ex.detailedContent?.[lang] || undefined,
      });
    }
  }

  // Build media items
  const mediaItems = [];
  let sortOrder = 0;
  if (ex.media?.images) {
    for (const imgId of ex.media.images) {
      mediaItems.push({
        mediaType: "image",
        url: imgId,
        sortOrder: sortOrder++,
      });
    }
  }
  if (ex.media?.videos) {
    for (const vid of ex.media.videos) {
      mediaItems.push({
        mediaType: "video",
        url: vid.url,
        title: vid.title || undefined,
        description: vid.description || undefined,
        sortOrder: sortOrder++,
      });
    }
  }
  if (ex.media?.audio) {
    for (const aud of ex.media.audio) {
      mediaItems.push({
        mediaType: "audio",
        url: aud.url,
        title: aud.title || undefined,
        description: aud.description || undefined,
        sortOrder: sortOrder++,
      });
    }
  }

  await client.mutation(api.exhibitions.save, {
    slug,
    qrCode: ex.qrCode || "",
    image: ex.image || "",
    dateRange: ex.dateRange || undefined,
    location: ex.location || undefined,
    curator: ex.curator || undefined,
    organizer: ex.organizer || undefined,
    sponsor: ex.sponsor || undefined,
    tags: ex.tags || undefined,
    enabledAttributes: ex.enabledAttributes || undefined,
    isFeatured: slug === exhibitions.featured,
    artifactSlugs: ex.artifacts || [],
    translations,
    mediaItems,
  });
}
console.log(
  `  Done: ${Object.keys(exhibitions.exhibitions).length} exhibitions migrated.`
);

// ── Migrate artifacts ────────────────────────────────────────────
console.log("\n--- Migrating artifacts ---");
for (const [slug, art] of Object.entries(artifacts.artifacts)) {
  console.log(`  Artifact: ${slug}`);

  // Build translation array
  const translations = [];
  if (art.translations) {
    for (const [lang, t] of Object.entries(art.translations)) {
      translations.push({
        language: lang,
        title: t.title || "",
        period: t.period || undefined,
        artist: t.artist || undefined,
        description: t.description || "",
        significance: t.significance || undefined,
        detailedContent: art.detailedContent?.[lang] || undefined,
      });
    }
  }

  // Build media items
  const mediaItems = [];
  let sortOrder = 0;
  if (art.media?.images) {
    for (const imgId of art.media.images) {
      mediaItems.push({
        mediaType: "image",
        url: imgId,
        sortOrder: sortOrder++,
      });
    }
  }
  if (art.media?.videos) {
    for (const vid of art.media.videos) {
      mediaItems.push({
        mediaType: "video",
        url: vid.url,
        title: vid.title || undefined,
        description: vid.description || undefined,
        sortOrder: sortOrder++,
      });
    }
  }
  if (art.media?.audio) {
    for (const aud of art.media.audio) {
      mediaItems.push({
        mediaType: "audio",
        url: aud.url,
        title: aud.title || undefined,
        description: aud.description || undefined,
        sortOrder: sortOrder++,
      });
    }
  }

  await client.mutation(api.artifacts.save, {
    slug,
    qrCode: art.qrCode || "",
    exhibitionSlug: art.exhibition || undefined,
    image: art.image || "",
    materials: art.materials || undefined,
    dimensions: art.dimensions || undefined,
    provenance: art.provenance || undefined,
    tags: art.tags || undefined,
    enabledAttributes: art.enabledAttributes || undefined,
    translations,
    mediaItems,
  });
}
console.log(
  `  Done: ${Object.keys(artifacts.artifacts).length} artifacts migrated.`
);

// ── Set featured exhibition ──────────────────────────────────────
console.log("\n--- Setting featured exhibition ---");
await client.mutation(api.exhibitions.setFeatured, {
  slug: exhibitions.featured,
});
console.log(`  Featured: ${exhibitions.featured}`);

console.log("\n=== Migration complete! ===");
