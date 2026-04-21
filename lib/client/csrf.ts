/**
 * @fileoverview CSRF Token Management
 * 
 * Provides client-side CSRF token handling with automatic injection
 * Single source of truth for all mutating requests
 */

let csrfToken: string | null = null;

/**
 * Generate a client-side CSRF token
 * Called once on app initialization
 */
export function initializeCsrfToken(): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty (not used server-side)
    return '';
  }
  
  if (!csrfToken) {
    // Client-side: generate and store in memory
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    csrfToken = btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  return csrfToken;
}

/**
 * Get current CSRF token
 */
export function getCsrfToken(): string {
  if (!csrfToken) {
    return initializeCsrfToken();
  }
  return csrfToken;
}

/**
 * Generate idempotency key for request deduplication
 * Format: timestamp-random
 */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Inject CSRF token and idempotency key into fetch options
 * Use this for all mutating requests (POST, PATCH, DELETE)
 */
export function withCsrfHeaders(options: RequestInit = {}): RequestInit {
  const method = options.method?.toUpperCase();
  
  // Only add CSRF for mutating operations
  if (!method || !['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    return options;
  }

  const headers = new Headers(options.headers);
  headers.set('x-csrf-token', getCsrfToken());
  headers.set('x-idempotency-key', generateIdempotencyKey());

  return {
    ...options,
    headers,
  };
}

/**
 * Enhanced fetch with automatic CSRF injection
 * Drop-in replacement for native fetch
 */
export async function secureFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, withCsrfHeaders(options));
}
