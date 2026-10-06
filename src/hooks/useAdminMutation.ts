import { useCallback } from 'react';
import { getFunctionName, type FunctionArgs, type FunctionReference, type FunctionReturnType } from 'convex/server';
import { authFetch } from '../utils/auth';

/** Keep deployment credentials on the server and reuse the admin session. */
export function useAdminMutation<Mutation extends FunctionReference<'mutation', 'internal'>>(mutation: Mutation) {
  const name = getFunctionName(mutation);
  return useCallback(async (args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> => {
    const response = await authFetch('/api/admin/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, args }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to save content');
    return result.value;
  }, [name]);
}
