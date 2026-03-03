/**
 * Client-side authentication utilities.
 *
 * Handles login via the server-side `/api/login` endpoint and stores the
 * session token in sessionStorage. Provides `authFetch` as a drop-in
 * replacement for `fetch` that automatically attaches the Bearer token.
 */

const TOKEN_KEY = 'admin-auth-token';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Attempt to log in with the given password. Returns true on success.
 */
export async function login(password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.token) {
      setToken(data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Log out the current session (server + client).
 */
export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  clearToken();
}

/**
 * Wrapper around `fetch` that attaches the auth token automatically.
 * If the server responds with 401, the token is cleared.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    clearToken();
  }

  return response;
}
