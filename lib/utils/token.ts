/**
 * @fileoverview Secure Token Generation and Validation
 * 
 * Cryptographically secure tokens for shared access (investigations & actions)
 * Industry standard: 64-character hex tokens with expiration validation
 */

import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure access token
 * Uses Node.js crypto module for true randomness
 * 
 * @returns 64-character hexadecimal token
 * 
 * @example
 * const token = generateAccessToken();
 * // => "a3f2c1d4e5f6g7h8..."
 */
export function generateAccessToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate token and check expiration
 * Security: Constant-time comparison to prevent timing attacks
 * 
 * @param providedToken - Token from request (URL param, header, etc)
 * @param storedToken - Token from database
 * @param expiresAt - Expiration timestamp from database
 * @returns true if token is valid and not expired
 * 
 * @example
 * const isValid = validateToken(
 *   req.query.token,
 *   dbRecord.accessToken,
 *   dbRecord.tokenExpiresAt
 * );
 */
export function validateToken(
  providedToken: string | undefined | null,
  storedToken: string,
  expiresAt: Date | string | null
): boolean {
  // Reject invalid inputs
  if (!providedToken || !storedToken) {
    return false;
  }

  // Check token match (constant-time comparison)
  if (!constantTimeCompare(providedToken, storedToken)) {
    return false;
  }

  // Check expiration
  if (expiresAt && isTokenExpired(expiresAt)) {
    return false;
  }

  return true;
}

/**
 * Check if token has expired
 * 
 * @param expiresAt - Expiration timestamp
 * @returns true if token has expired
 */
export function isTokenExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) {
    return false; // No expiration set = never expires
  }

  const expirationDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expirationDate.getTime() < Date.now();
}

/**
 * Create default token expiration date (30 days from now)
 * 
 * @param daysFromNow - Number of days until expiration (default: 30)
 * @returns Date object for token expiration
 */
export function createTokenExpiration(daysFromNow: number = 30): Date {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + daysFromNow);
  return expiration;
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Both strings must be same length
 * 
 * @param a - First string
 * @param b - Second string
 * @returns true if strings match
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate token with expiration for shared access invitation
 * 
 * @param daysValid - Number of days token should be valid
 * @returns Object with token and expiration date
 */
export function generateSharedAccessToken(daysValid: number = 30): {
  token: string;
  expiresAt: Date;
} {
  return {
    token: generateAccessToken(),
    expiresAt: createTokenExpiration(daysValid),
  };
}
