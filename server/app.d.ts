import type { Express } from 'express';
import type { RequestHandler } from 'http-proxy-middleware';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';

export function createApp(options: {
  rootDir: string;
  env?: Record<string, string | undefined>;
  serveStatic?: boolean;
}): { app: Express; convexProxy: RequestHandler<IncomingMessage, ServerResponse> | null };
export function upgradeConvex(proxy: RequestHandler<IncomingMessage, ServerResponse> | null, req: IncomingMessage, socket: Duplex, head: Buffer): void;
