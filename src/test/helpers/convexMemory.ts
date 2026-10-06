import { convexToJson, jsonToConvex, type Value } from 'convex/values';

type Row = Record<string, unknown> & { _id: string };

/** Exercise mutation handlers with persisted state and the real wire serializer. */
export function memoryDatabase(initial: Record<string, Row[]> = {}) {
  const tables = structuredClone(initial);
  const writes: unknown[] = [];
  let sequence = 0;
  const find = (id: string) => Object.values(tables).flat().find(row => row._id === id);
  const db = {
    query(table: string) {
      const filters: Array<[string, unknown]> = [];
      const builder = { eq(field: string, value: unknown) { filters.push([field, value]); return builder; } };
      const rows = () => (tables[table] || []).filter(row => filters.every(([field, value]) => row[field] === value));
      const query = {
        withIndex(_index: string, filter: (indexBuilder: typeof builder) => unknown) { filter(builder); return query; },
        first: async () => structuredClone(rows()[0] ?? null),
        collect: async () => structuredClone(rows()),
      };
      return query;
    },
    async insert(table: string, data: Record<string, unknown>) {
      const _id = `${table}:new-${++sequence}`;
      const stored = jsonToConvex(convexToJson(data as Record<string, Value | undefined>)) as Record<string, unknown>;
      (tables[table] ||= []).push({ ...stored, _id });
      writes.push(['insert', table, data]);
      return _id;
    },
    async patch(id: string, fields: Record<string, unknown>) {
      const row = find(id);
      if (!row) throw new Error('Missing row');
      for (const [key, value] of Object.entries(fields)) {
        if (value === undefined) delete row[key];
        else row[key] = structuredClone(value);
      }
      writes.push(['patch', id, fields]);
    },
    async delete(id: string) {
      for (const rows of Object.values(tables)) {
        const index = rows.findIndex(row => row._id === id);
        if (index >= 0) rows.splice(index, 1);
      }
      writes.push(['delete', id]);
    },
  };
  return { db, tables, writes };
}

export function handler(operation: unknown) {
  return (operation as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;
}

export function wireArgs(args: Record<string, Value | undefined>) {
  return jsonToConvex(convexToJson(args));
}
