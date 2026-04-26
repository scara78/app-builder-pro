/**
 * PKCE (Proof Key for Code Exchange) Helpers
 *
 * Implements the PKCE flow for Vercel OAuth:
 * - generateCodeVerifier: Creates a cryptographically random code_verifier
 * - generateCodeChallenge: Creates a SHA256-based code_challenge from the verifier
 *
 * Uses Web Crypto API for both randomness and hashing.
 *
 * @module services/deploy/pkce
 */

/**
 * Generates a cryptographically random code_verifier for PKCE.
 *
 * The verifier is a URL-safe base64 string of 43-128 characters,
 * derived from 32 random bytes.
 *
 * @returns A random code_verifier string
 */
export function generateCodeVerifier(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes);
}

/**
 * Generates a code_challenge from a code_verifier using SHA-256.
 *
 * The challenge is a URL-safe base64 encoding of the SHA-256 hash
 * of the code_verifier, as specified in RFC 7636.
 *
 * @param verifier - The code_verifier string
 * @returns A promise resolving to the code_challenge string
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Encodes a Uint8Array as a URL-safe base64 string.
 * Removes padding '=' characters as per PKCE spec.
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const binaryString = Array.from(buffer)
    .map((byte) => String.fromCharCode(byte))
    .join('');
  return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
