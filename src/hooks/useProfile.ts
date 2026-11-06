"use client";

import { useApi } from "./useApi";
import { useCompanyId } from "./useCompanyId";
import { authApi, companiesApi } from "@/services/api/resources";
import { getAccessToken } from "@/services/api/client";
import { remember } from "@/services/api/cache";
import type { CompanyDTO, UserDTO } from "@/types/api";

/** The sidebar, the user menu and the page all read the profile: one request serves them all. */
const PROFILE_TTL_MS = 60_000;

/** First letters of a name, e.g. "Roberto Gómez" -> "RG". */
export function initialsOf(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** The signed-in user, shared by every reader for a minute (cleared by `usersApi.update`). */
export const loadCurrentUser = () => remember(`/auth/me|${getAccessToken()}`, PROFILE_TTL_MS, authApi.me);

/** The company, shared the same way (cleared by `companiesApi.update`). */
export const loadCompany = (companyId: string) =>
  remember(`/companies/${companyId}|${getAccessToken()}`, PROFILE_TTL_MS, () => companiesApi.get(companyId));

/**
 * The signed-in user and their company. Cached for a minute per session token, so every
 * component that calls this shares the same two requests; saving the company or a user
 * clears the cache (see `companiesApi.update` and `usersApi.update`).
 */
export function useProfile(): { user: UserDTO | null; company: CompanyDTO | null } {
  const companyId = useCompanyId();
  const user = useApi(loadCurrentUser, []);
  const company = useApi(() => (companyId ? loadCompany(companyId) : Promise.resolve(null)), [companyId]);
  return { user: user.data, company: company.data };
}
