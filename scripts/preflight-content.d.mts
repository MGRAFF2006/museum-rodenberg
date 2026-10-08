type ContentTable = "artifacts" | "exhibitions";
type ContentRow = { slug: string; qrCode: string; revision?: number };
export function auditContent(collections: unknown): {
  checked: number;
  qrConflicts: Array<{ qrCode: string; items: Array<{ table: ContentTable; slug: string }> }>;
};
export function readContent(args: readonly string[]): Record<ContentTable, ContentRow[]>;
