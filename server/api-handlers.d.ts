/**
 * Type declarations for server/api-handlers.js
 *
 * Content CRUD (saveContent, deleteContent, saveAsset) has been removed —
 * those operations are now handled by Convex mutations on the client side.
 */

import type { IncomingHttpHeaders, IncomingMessage } from 'http';

interface ApiResult<T = unknown> {
  status: number;
  body: T;
}

export function uploadMedia(
  rootDir: string,
  headers: IncomingHttpHeaders,
  reqStream: IncomingMessage,
): Promise<{ urls: string[]; url: string | undefined; assets: unknown[] }>;

export function translate(
  body: Record<string, unknown>,
  apiUrl: string,
  apiKey: string | undefined,
): Promise<ApiResult>;

export function validateAssets(
  rootDir: string,
  body: Record<string, unknown>,
): ApiResult;

export function listUploads(rootDir: string): ApiResult;

export function deleteImage(
  rootDir: string,
  imagePath: string | null,
): ApiResult;
