import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ──────────────────────────────────────────────────────

/** List all exhibitions with ALL translations and media (admin use). */
export const list = query({
  handler: async (ctx) => {
    const [exhibitions, allTranslations, allMedia] = await Promise.all([
      ctx.db.query("exhibitions").collect(),
      ctx.db.query("exhibition_translations").collect(),
      ctx.db
        .query("media")
        .withIndex("by_parent", (q) => q.eq("parentType", "exhibition"))
        .collect(),
    ]);

    // Build lookup maps
    const translationsByExId = new Map<string, typeof allTranslations>();
    for (const t of allTranslations) {
      const key = t.exhibitionId;
      const arr = translationsByExId.get(key) ?? [];
      arr.push(t);
      translationsByExId.set(key, arr);
    }
    const mediaBySlug = new Map<string, typeof allMedia>();
    for (const m of allMedia) {
      const arr = mediaBySlug.get(m.parentSlug) ?? [];
      arr.push(m);
      mediaBySlug.set(m.parentSlug, arr);
    }

    return exhibitions.map((ex) => ({
      ...ex,
      translations: translationsByExId.get(ex._id) ?? [],
      media: mediaBySlug.get(ex.slug) ?? [],
    }));
  },
});

/** List exhibitions with only the requested language (+ de fallback).
 *  Returns ~1/7th the translation data compared to the full list query.
 *  Omits detailedContent from translations (only needed on detail pages). */
export const listForLanguage = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    const langs = new Set([args.language, "de"]);

    const [exhibitions, allTranslations, allMedia] = await Promise.all([
      ctx.db.query("exhibitions").collect(),
      ctx.db.query("exhibition_translations").collect(),
      ctx.db
        .query("media")
        .withIndex("by_parent", (q) => q.eq("parentType", "exhibition"))
        .collect(),
    ]);

    // Build lookup maps — filter to requested languages only
    const translationsByExId = new Map<string, typeof allTranslations>();
    for (const t of allTranslations) {
      if (!langs.has(t.language)) continue;
      const key = t.exhibitionId;
      const arr = translationsByExId.get(key) ?? [];
      // Strip detailedContent to reduce payload (only needed on detail pages)
      const { detailedContent: _, ...rest } = t;
      arr.push(rest as typeof t);
      translationsByExId.set(key, arr);
    }
    const mediaBySlug = new Map<string, typeof allMedia>();
    for (const m of allMedia) {
      const arr = mediaBySlug.get(m.parentSlug) ?? [];
      arr.push(m);
      mediaBySlug.set(m.parentSlug, arr);
    }

    return exhibitions.map((ex) => ({
      ...ex,
      translations: translationsByExId.get(ex._id) ?? [],
      media: mediaBySlug.get(ex.slug) ?? [],
    }));
  },
});

/** Get a single exhibition by slug, with translations and media. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const exhibition = await ctx.db
      .query("exhibitions")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!exhibition) return null;

    const translations = await ctx.db
      .query("exhibition_translations")
      .withIndex("by_exhibition", (q) => q.eq("exhibitionId", exhibition._id))
      .collect();
    const mediaItems = await ctx.db
      .query("media")
      .withIndex("by_parent", (q) =>
        q.eq("parentType", "exhibition").eq("parentSlug", exhibition.slug)
      )
      .collect();
    return { ...exhibition, translations, media: mediaItems };
  },
});

/** Get the featured exhibition slug from settings. */
export const getFeatured = query({
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "featured_exhibition"))
      .first();
    return setting?.value ?? null;
  },
});

// ── Mutations ────────────────────────────────────────────────────

/** Create or update an exhibition. */
export const save = mutation({
  args: {
    slug: v.string(),
    qrCode: v.string(),
    image: v.string(),
    dateRange: v.optional(v.string()),
    location: v.optional(v.string()),
    curator: v.optional(v.string()),
    organizer: v.optional(v.string()),
    sponsor: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    enabledAttributes: v.optional(v.array(v.string())),
    isFeatured: v.boolean(),
    artifactSlugs: v.array(v.string()),
    // Translations as an array of objects
    translations: v.array(
      v.object({
        language: v.string(),
        title: v.string(),
        subtitle: v.optional(v.string()),
        description: v.string(),
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
    const { translations, mediaItems, ...exhibitionData } = args;

    // Check if exhibition already exists
    const existing = await ctx.db
      .query("exhibitions")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    let exhibitionId;
    if (existing) {
      await ctx.db.patch(existing._id, exhibitionData);
      exhibitionId = existing._id;
    } else {
      exhibitionId = await ctx.db.insert("exhibitions", exhibitionData);
    }

    // If marked featured, update settings
    if (args.isFeatured) {
      const setting = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", "featured_exhibition"))
        .first();
      if (setting) {
        await ctx.db.patch(setting._id, { value: args.slug });
      } else {
        await ctx.db.insert("settings", {
          key: "featured_exhibition",
          value: args.slug,
        });
      }
    }

    // Upsert translations
    for (const t of translations) {
      const existingT = await ctx.db
        .query("exhibition_translations")
        .withIndex("by_exhibition_lang", (q) =>
          q.eq("exhibitionId", exhibitionId).eq("language", t.language)
        )
        .first();
      if (existingT) {
        await ctx.db.patch(existingT._id, { ...t, exhibitionId });
      } else {
        await ctx.db.insert("exhibition_translations", {
          ...t,
          exhibitionId,
        });
      }
    }

    // Replace media items
    const existingMedia = await ctx.db
      .query("media")
      .withIndex("by_parent", (q) =>
        q.eq("parentType", "exhibition").eq("parentSlug", args.slug)
      )
      .collect();
    for (const m of existingMedia) {
      await ctx.db.delete(m._id);
    }
    if (mediaItems) {
      for (const m of mediaItems) {
        await ctx.db.insert("media", {
          parentType: "exhibition",
          parentSlug: args.slug,
          ...m,
        });
      }
    }

    return exhibitionId;
  },
});

/** Delete an exhibition and its translations/media. */
export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const exhibition = await ctx.db
      .query("exhibitions")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!exhibition) return;

    // Delete translations
    const translations = await ctx.db
      .query("exhibition_translations")
      .withIndex("by_exhibition", (q) => q.eq("exhibitionId", exhibition._id))
      .collect();
    for (const t of translations) {
      await ctx.db.delete(t._id);
    }

    // Delete media
    const media = await ctx.db
      .query("media")
      .withIndex("by_parent", (q) =>
        q.eq("parentType", "exhibition").eq("parentSlug", args.slug)
      )
      .collect();
    for (const m of media) {
      await ctx.db.delete(m._id);
    }

    // If this was the featured exhibition, clear it
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "featured_exhibition"))
      .first();
    if (setting?.value === args.slug) {
      // Set to first remaining exhibition
      const remaining = await ctx.db.query("exhibitions").first();
      if (remaining && remaining._id !== exhibition._id) {
        await ctx.db.patch(setting._id, { value: remaining.slug });
      } else {
        await ctx.db.delete(setting._id);
      }
    }

    // Clear exhibitionSlug on child artifacts
    const childArtifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_exhibition", (q) => q.eq("exhibitionSlug", args.slug))
      .collect();
    for (const a of childArtifacts) {
      await ctx.db.patch(a._id, { exhibitionSlug: undefined });
    }

    await ctx.db.delete(exhibition._id);
  },
});

/** Set the featured exhibition. */
export const setFeatured = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "featured_exhibition"))
      .first();
    if (setting) {
      await ctx.db.patch(setting._id, { value: args.slug });
    } else {
      await ctx.db.insert("settings", {
        key: "featured_exhibition",
        value: args.slug,
      });
    }
  },
});
