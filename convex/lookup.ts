import { query } from "./_generated/server";
import { v } from "convex/values";

/** Find an exhibition or artifact by QR code. */
export const findByQRCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    // Try exhibitions first
    const exhibition = await ctx.db
      .query("exhibitions")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .first();
    if (exhibition) {
      return { type: "exhibition" as const, slug: exhibition.slug };
    }

    // Try artifacts
    const artifact = await ctx.db
      .query("artifacts")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .first();
    if (artifact) {
      return { type: "artifact" as const, slug: artifact.slug };
    }

    return null;
  },
});

/** Full-text search across exhibitions and artifacts (title, description). */
export const search = query({
  args: {
    query: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return { exhibitions: [], artifacts: [] };

    const q = args.query.toLowerCase();

    // Search exhibition translations
    const allExTranslations = await ctx.db
      .query("exhibition_translations")
      .collect();
    const matchingExIds = new Set<string>();
    for (const t of allExTranslations) {
      if (t.language !== args.language) continue;
      if (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.subtitle && t.subtitle.toLowerCase().includes(q))
      ) {
        matchingExIds.add(t.exhibitionId);
      }
    }

    const exhibitions = [];
    for (const id of matchingExIds) {
      const ex = await ctx.db.get(id);
      if (ex) exhibitions.push(ex);
    }

    // Search artifact translations
    const allArtTranslations = await ctx.db
      .query("artifact_translations")
      .collect();
    const matchingArtIds = new Set<string>();
    for (const t of allArtTranslations) {
      if (t.language !== args.language) continue;
      if (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.significance && t.significance.toLowerCase().includes(q))
      ) {
        matchingArtIds.add(t.artifactId);
      }
    }

    const artifacts = [];
    for (const id of matchingArtIds) {
      const art = await ctx.db.get(id);
      if (art) artifacts.push(art);
    }

    return { exhibitions, artifacts };
  },
});
