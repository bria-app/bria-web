"use client";

import { useCallback, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { preferencesApi } from "@/services/api/custom-fields";

interface CompanyPreference<T> {
  value: T;
  loading: boolean;
  /** Applies the value at once and persists it; restores the previous value and rethrows on failure. */
  save: (next: T) => Promise<void>;
}

/**
 * A per-company preference stored through `PUT /preferences/{key}`.
 * `parse` turns whatever the server holds (or null) into a valid value.
 */
export function useCompanyPreference<T>(
  companyId: string | null,
  key: string,
  parse: (raw: unknown) => T,
): CompanyPreference<T> {
  const scope = `${companyId ?? ""}|${key}`;
  const loaded = useApi(
    () => (companyId ? preferencesApi.get(companyId, key).then((r) => r.value) : Promise.resolve(null)),
    [companyId, key],
  );
  // A saved value wins over the loaded one, but only for the company and key it was saved for.
  const [saved, setSaved] = useState<{ scope: string; value: T } | null>(null);
  const override = saved?.scope === scope ? saved : null;
  const value = override ? override.value : parse(loaded.data);

  const save = useCallback(
    async (next: T) => {
      if (!companyId) return;
      const previous = override;
      setSaved({ scope, value: next });
      try {
        await preferencesApi.put(companyId, key, next);
      } catch (err) {
        setSaved(previous);
        throw err;
      }
    },
    [companyId, key, scope, override],
  );

  return { value, loading: loaded.loading, save };
}
