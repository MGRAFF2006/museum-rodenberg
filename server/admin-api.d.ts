import type { IncomingMessage, ServerResponse } from 'node:http';
export function createAdminApi(rootDir: string, env: Record<string, string | undefined>):
  (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void;
