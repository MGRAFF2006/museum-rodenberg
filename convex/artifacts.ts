import { query, mutation, type MutationCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireServerSecret } from "./auth";
import { validateContentInput } from "./contentValidation";

// ── Queries ──────────────────────────────────────────────────────

/** List all artifacts with ALL translations and media (admin use). */
export const list = query({
  handler: async (ctx) => {
    const [artifacts, allTranslations, allMedia] = await Promise.all([
      ctx.db.query("artifacts").collect(),
      ctx.db.query("artifact_translations").collect(),
      ctx.db
        .query("media")
        .withIndex("by_parent", (q) => q.eq("parentType", "artifact"))
        .collect(),
    ]);

    // Build lookup maps
    const translationsByArtId = new Map<string, typeof allTranslations>();
    for (const t of allTranslations) {
      const key = t.artifactId;
      const arr = translationsByArtId.get(key) ?? [];
      arr.push(t);
      translationsByArtId.set(key, arr);
    }
    const mediaBySlug = new Map<string, typeof allMedia>();
    for (const m of allMedia) {
      const arr = mediaBySlug.get(m.parentSlug) ?? [];
      arr.push(m);
      mediaBySlug.set(m.parentSlug, arr);
    }

    return artifacts.map((art) => ({
      ...art,
      translations: translationsByArtId.get(art._id) ?? [],
      media: mediaBySlug.get(art.slug) ?? [],
    }));
  },
});

/** List artifacts with only the requested language (+ de fallback).
 *  Returns ~1/7th the translation data compared to the full list query.
 *  Omits detailedContent from translations (only needed on detail pages). */
export const listForLanguage = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    const langs = new Set([args.language, "de"]);

    const [artifacts, allTranslations, allMedia] = await Promise.all([
      ctx.db.query("artifacts").collect(),
      ctx.db.query("artifact_translations").collect(),
      ctx.db
        .query("media")
        .withIndex("by_parent", (q) => q.eq("parentType", "artifact"))
        .collect(),
    ]);

    // Build lookup maps — filter to requested languages only
    const translationsByArtId = new Map<string, typeof allTranslations>();
    for (const t of allTranslations) {
      if (!langs.has(t.language)) continue;
      const key = t.artifactId;
      const arr = translationsByArtId.get(key) ?? [];
      // Strip detailedContent to reduce payload (only needed on detail pages)
      const { detailedContent: _, ...rest } = t;
      arr.push(rest as typeof t);
      translationsByArtId.set(key, arr);
    }
    const mediaBySlug = new Map<string, typeof allMedia>();
    for (const m of allMedia) {
      const arr = mediaBySlug.get(m.parentSlug) ?? [];
      arr.push(m);
      mediaBySlug.set(m.parentSlug, arr);
    }

    return artifacts.map((art) => ({
      ...art,
      translations: translationsByArtId.get(art._id) ?? [],
      media: mediaBySlug.get(art.slug) ?? [],
    }));
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
    return { ...artifact, revision: artifact.revision ?? 0, translations, media: mediaItems };
  },
});

/** Get all artifacts belonging to an exhibition (by exhibition slug).
 *  Bulk-fetches translations and media to avoid N+1 queries. */
export const getByExhibition = query({
  args: { exhibitionSlug: v.string() },
  handler: async (ctx, args) => {
    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_exhibition", (q) =>
        q.eq("exhibitionSlug", args.exhibitionSlug)
      )
      .collect();

    if (artifacts.length === 0) return [];

    // Bulk-fetch all artifact translations and media for these artifacts
    const artIds = new Set(artifacts.map((a) => a._id));
    const artSlugs = new Set(artifacts.map((a) => a.slug));

    const [allTranslations, allMedia] = await Promise.all([
      ctx.db.query("artifact_translations").collect(),
      ctx.db
        .query("media")
        .withIndex("by_parent", (q) => q.eq("parentType", "artifact"))
        .collect(),
    ]);

    // Filter to only relevant items and build lookup maps
    const translationsByArtId = new Map<string, typeof allTranslations>();
    for (const t of allTranslations) {
      if (!artIds.has(t.artifactId)) continue;
      const arr = translationsByArtId.get(t.artifactId) ?? [];
      arr.push(t);
      translationsByArtId.set(t.artifactId, arr);
    }
    const mediaBySlug = new Map<string, typeof allMedia>();
    for (const m of allMedia) {
      if (!artSlugs.has(m.parentSlug)) continue;
      const arr = mediaBySlug.get(m.parentSlug) ?? [];
      arr.push(m);
      mediaBySlug.set(m.parentSlug, arr);
    }

    return artifacts.map((art) => ({
      ...art,
      translations: translationsByArtId.get(art._id) ?? [],
      media: mediaBySlug.get(art.slug) ?? [],
    }));
  },
});

// ── Mutations ────────────────────────────────────────────────────

async function syncExhibitionMembership(
  ctx: MutationCtx,
  slug: string,
  exhibitionSlug?: string
) {
  // Scan all lists so moves and repeated deletes also repair stale memberships.
  const exhibitions = await ctx.db.query("exhibitions").collect();
  for (const exhibition of exhibitions) {
    const listed = exhibition.artifactSlugs.includes(slug);
    if (exhibition.slug === exhibitionSlug) {
      if (!listed) {
        await ctx.db.patch(exhibition._id, {
          artifactSlugs: [...exhibition.artifactSlugs, slug],
          revision: (exhibition.revision ?? 0) + 1,
        });
      }
    } else if (listed) {
      await ctx.db.patch(exhibition._id, {
        artifactSlugs: exhibition.artifactSlugs.filter((s) => s !== slug),
        revision: (exhibition.revision ?? 0) + 1,
      });
    }
  }
}

/** Create or update an artifact. */
export const save = mutation({
  args: { serverSecret: v.optional(v.string()),
    slug: v.string(),
    expectedRevision: v.optional(v.number()),
    expectedDocumentId: v.optional(v.string()),
    qrCode: v.string(),
    exhibitionSlug: v.optional(v.string()),
    image: v.string(),
    materials: v.optional(v.array(v.string())),
    dimensions: v.optional(v.string()),
    provenance: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    enabledAttributes: v.optional(v.array(v.string())),
    createOnly: v.optional(v.boolean()),
    replaceTranslations: v.optional(v.boolean()),
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
  handler: async (ctx, { serverSecret, createOnly, replaceTranslations, ...args }) => {
    requireServerSecret(serverSecret);
    validateContentInput(args.slug, args.translations);
    const { translations, mediaItems, expectedRevision, expectedDocumentId, ...artifactData } = args;
    if (artifactData.exhibitionSlug === "") artifactData.exhibitionSlug = undefined;

    // Check if artifact already exists
    const existing = await ctx.db
      .query("artifacts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    const exhibitionChanged = args.exhibitionSlug !== undefined &&
      artifactData.exhibitionSlug !== (existing?.exhibitionSlug || undefined);
    if (createOnly && existing) throw new Error("An artifact with this ID already exists");
    if (existing
      ? expectedRevision !== (existing.revision ?? 0) || expectedDocumentId !== existing._id
      : expectedRevision !== undefined || expectedDocumentId !== undefined) {
      throw new ConvexError({ code: "STALE_CONTENT" });
    }
    const revision = existing ? (existing.revision ?? 0) + 1 : 0;
    let artifactId;
    if (existing) {
      await ctx.db.patch(existing._id, { ...artifactData, revision });
      artifactId = existing._id;
    } else {
      artifactId = await ctx.db.insert("artifacts", { ...artifactData, revision });
    }

    if (exhibitionChanged) {
      await syncExhibitionMembership(ctx, args.slug, args.exhibitionSlug || undefined);
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

    if (replaceTranslations) {
      const languages = new Set(translations.map((t) => t.language));
      const stored = await ctx.db
        .query("artifact_translations")
        .withIndex("by_artifact", (q) => q.eq("artifactId", artifactId))
        .collect();
      for (const translation of stored) {
        if (!languages.has(translation.language)) await ctx.db.delete(translation._id);
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
  args: {
    serverSecret: v.optional(v.string()),
    slug: v.string(),
    expectedRevision: v.optional(v.number()),
    expectedDocumentId: v.optional(v.string()),
  },
  handler: async (ctx, { serverSecret, ...args }) => {
    requireServerSecret(serverSecret);
    const artifact = await ctx.db
      .query("artifacts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!artifact || args.expectedRevision !== (artifact.revision ?? 0) ||
      args.expectedDocumentId !== artifact._id) {
      throw new ConvexError({ code: "STALE_CONTENT" });
    }
    await syncExhibitionMembership(ctx, args.slug);

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

    await ctx.db.delete(artifact._id);
  },
});
