/**
 * Type declarations for server/api-handlers.js
 */

import type { IncomingHttpHeaders, IncomingMessage } from 'http';

interface ApiResult<T = unknown> {
  status: number;
  body: T;
}

export function saveContent(
  rootDir: string,
  body: Record<string, unknown>,
): ApiResult;

export function deleteContent(
  rootDir: string,
  body: Record<string, unknown>,
): ApiResult;

export function saveAsset(
  rootDir: string,
  body: Record<string, unknown>,
): ApiResult;

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
