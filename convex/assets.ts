import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ──────────────────────────────────────────────────────

/** List all assets. */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("assets").collect();
  },
});

/** Get an asset by its assetId (the original ID string). */
export const getByAssetId = query({
  args: { assetId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_assetId", (q) => q.eq("assetId", args.assetId))
      .first();
  },
});

// ── Mutations ────────────────────────────────────────────────────

/** Create or update an asset. */
export const save = mutation({
  args: {
    assetId: v.string(),
    name: v.string(),
    alt: v.string(),
    url: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("assets")
      .withIndex("by_assetId", (q) => q.eq("assetId", args.assetId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("assets", args);
    }
  },
});

/** Delete an asset by assetId. */
export const remove = mutation({
  args: { assetId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("assets")
      .withIndex("by_assetId", (q) => q.eq("assetId", args.assetId))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
