/** Authentication helpers: login/register/logout + JWT claim access. */
import { apiClient, clearTokens, getAccessToken, getRefreshToken, setTokens } from "./api/client";
import type { TokenDTO } from "@/types/api";

interface JwtClaims {
  sub?: string;
  company_id?: string;
  role?: string;
  exp?: number;
}

/** The last token decoded: hooks read the claims on every render, the token rarely changes. */
let lastDecoded: { token: string; claims: JwtClaims | null } | null = null;

function decodeJwt(token: string): JwtClaims | null {
  if (lastDecoded?.token === token) return lastDecoded.claims;
  let claims: JwtClaims | null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    claims = JSON.parse(json) as JwtClaims;
  } catch {
    claims = null;
  }
  lastDecoded = { token, claims };
  return claims;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  tax_id: string;
  business_type?: string;
}

export async function login(email: string, password: string): Promise<void> {
  const tokens = await apiClient.post<TokenDTO>(
    "/auth/login",
    { email, password },
    { anonymous: true },
  );
  setTokens(tokens.access_token, tokens.refresh_token);
}

export async function register(payload: RegisterPayload): Promise<void> {
  const tokens = await apiClient.post<TokenDTO>("/auth/register", payload, {
    anonymous: true,
  });
  setTokens(tokens.access_token, tokens.refresh_token);
}

export function logout(): void {
  clearTokens();
}

/**
 * Signed in = a valid access token, or an expired one with a refresh token that is still
 * valid: the first API call answers 401 and the client renews the session transparently
 * (see `api-client.ts`), so a reload after the access token expires doesn't log anyone out.
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  const claims = decodeJwt(token);
  if (!claims?.exp || claims.exp * 1000 > Date.now()) return true;
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const refreshExp = decodeJwt(refresh)?.exp;
  return !refreshExp || refreshExp * 1000 > Date.now();
}

export function getCompanyId(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  return decodeJwt(token)?.company_id ?? null;
}

export function getRole(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  return decodeJwt(token)?.role ?? null;
}

/** Calls `onChange` when another tab signs in or out (the stored token changes). */
export function subscribeToSession(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
