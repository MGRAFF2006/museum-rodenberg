export function resolveConvexUrl(configured: string | undefined, origin: string): string {
  return new URL(configured || 'http://127.0.0.1:3210', origin).href.replace(/\/$/, '');
}
