import { ConvexError } from "convex/values";
import type { MutationCtx } from "./_generated/server";

/** Check both indexed ranges in the mutation transaction before writing. */
export async function requireUniqueQRCode(ctx: MutationCtx, qrCode: string, existingId?: string) {
  if (!qrCode.trim()) return;
  const [artifacts, exhibitions] = await Promise.all([
    ctx.db.query("artifacts").withIndex("by_qrCode", q => q.eq("qrCode", qrCode)).collect(),
    ctx.db.query("exhibitions").withIndex("by_qrCode", q => q.eq("qrCode", qrCode)).collect(),
  ]);
  if ([...artifacts, ...exhibitions].some(item => item._id !== existingId)) {
    throw new ConvexError({ code: "QR_CONFLICT" });
  }
}
