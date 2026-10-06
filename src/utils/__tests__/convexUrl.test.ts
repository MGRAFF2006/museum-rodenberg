import { describe, expect, it } from 'vitest';
import { resolveConvexUrl } from '../convexUrl';

describe('Convex browser endpoint', () => {
  it('uses the visited LAN origin for the Compose proxy', () => {
    expect(resolveConvexUrl('/convex', 'http://museum.local:3000')).toBe('http://museum.local:3000/convex');
  });

  it('keeps HTTPS when the app is accessed through HTTPS', () => {
    expect(resolveConvexUrl('/convex', 'https://museum.example')).toBe('https://museum.example/convex');
  });

  it('preserves a configured external backend', () => {
    expect(resolveConvexUrl('http://custom-backend:6543', 'http://museum.local:3000')).toBe('http://custom-backend:6543');
  });

  it('retains the direct local development fallback', () => {
    expect(resolveConvexUrl(undefined, 'http://localhost:5173')).toBe('http://127.0.0.1:3210');
  });
});
