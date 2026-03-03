import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Exhibitions ─────────────────────────────────────────────────
  exhibitions: defineTable({
    slug: v.string(), // URL-friendly ID (was the JSON object key)
    qrCode: v.string(),
    image: v.string(), // asset ID reference
    dateRange: v.optional(v.string()),
    location: v.optional(v.string()),
    curator: v.optional(v.string()),
    organizer: v.optional(v.string()),
    sponsor: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    enabledAttributes: v.optional(v.array(v.string())),
    isFeatured: v.boolean(),
    // Artifact slugs in display order (replaces the `artifacts: []` array)
    artifactSlugs: v.array(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_qrCode", ["qrCode"]),

  // ── Exhibition translations (one row per exhibition × language) ─
  exhibition_translations: defineTable({
    exhibitionId: v.id("exhibitions"),
    language: v.string(), // "de" | "en" | "fr" | ...
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.string(),
    detailedContent: v.optional(v.string()), // markdown
  })
    .index("by_exhibition", ["exhibitionId"])
    .index("by_exhibition_lang", ["exhibitionId", "language"]),

  // ── Artifacts ───────────────────────────────────────────────────
  artifacts: defineTable({
    slug: v.string(), // URL-friendly ID (was the JSON object key)
    qrCode: v.string(),
    exhibitionSlug: v.optional(v.string()), // link to exhibition by slug
    image: v.string(), // asset ID reference
    materials: v.optional(v.array(v.string())),
    dimensions: v.optional(v.string()),
    provenance: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    enabledAttributes: v.optional(v.array(v.string())),
  })
    .index("by_slug", ["slug"])
    .index("by_qrCode", ["qrCode"])
    .index("by_exhibition", ["exhibitionSlug"]),

  // ── Artifact translations (one row per artifact × language) ────
  artifact_translations: defineTable({
    artifactId: v.id("artifacts"),
    language: v.string(),
    title: v.string(),
    period: v.optional(v.string()),
    artist: v.optional(v.string()),
    description: v.string(),
    significance: v.optional(v.string()),
    detailedContent: v.optional(v.string()), // markdown
  })
    .index("by_artifact", ["artifactId"])
    .index("by_artifact_lang", ["artifactId", "language"]),

  // ── Assets (registry for uploaded files; files stay on disk) ───
  assets: defineTable({
    assetId: v.string(), // original ID from assets.json (e.g. "pexels_photo_123")
    name: v.string(),
    alt: v.string(),
    url: v.string(), // e.g. "/uploads/pexels_photo_123.jpg"
    type: v.union(
      v.literal("image"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("other")
    ),
  }).index("by_assetId", ["assetId"]),

  // ── Media items (images/videos/audio linked to exhibitions or artifacts) ─
  media: defineTable({
    parentType: v.union(
      v.literal("exhibition"),
      v.literal("artifact")
    ),
    parentSlug: v.string(), // slug of the parent exhibition/artifact
    mediaType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
    url: v.string(), // asset ID or external URL
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_parent", ["parentType", "parentSlug"]),

  // ── Settings (singleton-ish: featured exhibition slug, etc.) ───
  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
