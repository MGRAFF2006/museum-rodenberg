import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ──────────────────────────────────────────────────────

/** List all artifacts with their translations and media. */
export const list = query({
  handler: async (ctx) => {
    const artifacts = await ctx.db.query("artifacts").collect();
    const result = [];
    for (const art of artifacts) {
      const translations = await ctx.db
        .query("artifact_translations")
        .withIndex("by_artifact", (q) => q.eq("artifactId", art._id))
        .collect();
      const mediaItems = await ctx.db
        .query("media")
        .withIndex("by_parent", (q) =>
          q.eq("parentType", "artifact").eq("parentSlug", art.slug)
        )
        .collect();
      result.push({ ...art, translations, media: mediaItems });
    }
    return result;
  },
});

/** Get a single artifact by slug, with translations and media. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const artifact = await ctx.db
      .query("artifacts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!artifact) return null;

    const translations = await ctx.db
      .query("artifact_translations")
      .withIndex("by_artifact", (q) => q.eq("artifactId", artifact._id))
      .collect();
    const mediaItems = await ctx.db
      .query("media")
      .withIndex("by_parent", (q) =>
        q.eq("parentType", "artifact").eq("parentSlug", artifact.slug)
      )
      .collect();
    return { ...artifact, translations, media: mediaItems };
  },
});

/** Get all artifacts belonging to an exhibition (by exhibition slug). */
export const getByExhibition = query({
  args: { exhibitionSlug: v.string() },
  handler: async (ctx, args) => {
    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_exhibition", (q) =>
        q.eq("exhibitionSlug", args.exhibitionSlug)
      )
      .collect();
    const result = [];
    for (const art of artifacts) {
      const translations = await ctx.db
        .query("artifact_translations")
        .withIndex("by_artifact", (q) => q.eq("artifactId", art._id))
        .collect();
      const mediaItems = await ctx.db
        .query("media")
        .withIndex("by_parent", (q) =>
          q.eq("parentType", "artifact").eq("parentSlug", art.slug)
        )
        .collect();
      result.push({ ...art, translations, media: mediaItems });
    }
    return result;
  },
});

// ── Mutations ────────────────────────────────────────────────────

/** Create or update an artifact. */
export const save = mutation({
  args: {
    slug: v.string(),
    qrCode: v.string(),
    exhibitionSlug: v.optional(v.string()),
    image: v.string(),
    materials: v.optional(v.array(v.string())),
    dimensions: v.optional(v.string()),
    provenance: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    enabledAttributes: v.optional(v.array(v.string())),
    // Translations as an array
    translations: v.array(
      v.object({
        language: v.string(),
        title: v.string(),
        period: v.optional(v.string()),
        artist: v.optional(v.string()),
        description: v.string(),
        significance: v.optional(v.string()),
        detailedContent: v.optional(v.string()),
      })
    ),
    // Media items
    mediaItems: v.optional(
      v.array(
        v.object({
          mediaType: v.union(
            v.literal("image"),
            v.literal("video"),
            v.literal("audio")
          ),
          url: v.string(),
          title: v.optional(v.string()),
          description: v.optional(v.string()),
          sortOrder: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { translations, mediaItems, ...artifactData } = args;

    // Check if artifact already exists
    const existing = await ctx.db
      .query("artifacts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    let artifactId;
    if (existing) {
      await ctx.db.patch(existing._id, artifactData);
      artifactId = existing._id;
    } else {
      artifactId = await ctx.db.insert("artifacts", artifactData);
    }

    // Upsert translations
    for (const t of translations) {
      const existingT = await ctx.db
        .query("artifact_translations")
        .withIndex("by_artifact_lang", (q) =>
          q.eq("artifactId", artifactId).eq("language", t.language)
        )
        .first();
      if (existingT) {
        await ctx.db.patch(existingT._id, { ...t, artifactId });
      } else {
        await ctx.db.insert("artifact_translations", {
          ...t,
          artifactId,
        });
      }
    }

    // Replace media items
    const existingMedia = await ctx.db
      .query("media")
      .withIndex("by_parent", (q) =>
        q.eq("parentType", "artifact").eq("parentSlug", args.slug)
      )
      .collect();
    for (const m of existingMedia) {
      await ctx.db.delete(m._id);
    }
    if (mediaItems) {
      for (const m of mediaItems) {
        await ctx.db.insert("media", {
          parentType: "artifact",
          parentSlug: args.slug,
          ...m,
        });
      }
    }

    return artifactId;
  },
});

/** Delete an artifact and its translations/media. */
export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const artifact = await ctx.db
      .query("artifacts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!artifact) return;

    // Delete translations
    const translations = await ctx.db
      .query("artifact_translations")
      .withIndex("by_artifact", (q) => q.eq("artifactId", artifact._id))
      .collect();
    for (const t of translations) {
      await ctx.db.delete(t._id);
    }

    // Delete media
    const media = await ctx.db
      .query("media")
      .withIndex("by_parent", (q) =>
        q.eq("parentType", "artifact").eq("parentSlug", args.slug)
      )
      .collect();
    for (const m of media) {
      await ctx.db.delete(m._id);
    }

    // Remove from parent exhibition's artifactSlugs if present
    if (artifact.exhibitionSlug) {
      const exhibition = await ctx.db
        .query("exhibitions")
        .withIndex("by_slug", (q) => q.eq("slug", artifact.exhibitionSlug!))
        .first();
      if (exhibition) {
        const updatedSlugs = exhibition.artifactSlugs.filter(
          (s) => s !== args.slug
        );
        await ctx.db.patch(exhibition._id, { artifactSlugs: updatedSlugs });
      }
    }

    await ctx.db.delete(artifact._id);
  },
});
