/** Explicit null clears a field; omitted keys retain patch semantics. */
export function clearNullFields<T extends Record<string, unknown>>(fields: T) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value === null ? undefined : value])) as {
    [Key in keyof T]: null extends T[Key] ? Exclude<T[Key], null> | undefined : T[Key];
  };
}
