import { useCallback } from 'react';
import { getFunctionName, type FunctionReference, type FunctionArgs, type FunctionReturnType } from 'convex/server';
import { authFetch } from '../utils/auth';

export class ContentConflictError extends Error {
  readonly code = 'STALE_CONTENT';
}

export class ContentQRCodeError extends Error {
  readonly code = 'QR_CONFLICT';
}

/** Browser sessions go to Express; the server credential never reaches the client. */
export function useProtectedMutation<Mutation extends FunctionReference<'mutation'>>(mutation: Mutation) {
  const operation = getFunctionName(mutation);
  return useCallback(async (args: Omit<FunctionArgs<Mutation>, 'serverSecret'>): Promise<FunctionReturnType<Mutation>> => {
    const response = await authFetch('/api/content-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, args }),
    });
    if (response.status === 409) {
      const error = await response.json().catch(() => null);
      if (error?.code === 'QR_CONFLICT') throw new ContentQRCodeError('QR code is already assigned to another item.');
      if (error?.code === 'STALE_CONTENT') throw new ContentConflictError('Content changed. Reopen it before saving.');
    }
    if (!response.ok) throw new Error(response.status === 401 ? 'Please log in again' : 'Failed to write content');
    const data = await response.json();
    return data.result;
  }, [operation]);
}
