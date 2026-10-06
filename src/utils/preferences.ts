// Preferences are optional: privacy settings or a full storage quota must not
// prevent visitors from reading the museum. Keep state in memory on failure.
let warned = false;
function warnUnavailable() {
  if (!warned) console.warn('Browser preferences cannot be persisted in this session.');
  warned = true;
}
export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { warnUnavailable(); return null; }
}
export function writePreference(key: string, value: string): void {
  try { localStorage.setItem(key, value); }
  catch { warnUnavailable(); }
}
export function readJSONPreference(key: string): unknown {
  const value = readPreference(key);
  if (!value) return undefined;
  try { return JSON.parse(value); }
  catch { return undefined; } // Invalid old preferences use the current defaults.
}
