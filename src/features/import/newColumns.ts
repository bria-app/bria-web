import { customFieldsApi } from "@/services/api/custom-fields";
import type { CustomFieldEntity } from "@/types/custom-fields";
import type { NewCustomColumn } from "./types";

/**
 * Creates (or finds, when one with that name exists) the custom fields for the file's new
 * columns, and returns a function that moves each row's values to the keys the server saved.
 */
export async function ensureNewColumns(
  companyId: string,
  entity: CustomFieldEntity,
  newColumns: NewCustomColumn[],
): Promise<(custom: Record<string, string>) => Record<string, string>> {
  if (newColumns.length === 0) return (custom) => custom;
  const ensured = await customFieldsApi.ensure(
    companyId,
    entity,
    newColumns.map((c) => ({ label: c.label, field_type: c.field_type })),
  );
  const keyMap = new Map<string, string>();
  for (const col of newColumns) {
    const match = ensured.find((f) => f.key === col.key) ?? ensured.find((f) => f.label.toLowerCase() === col.label.toLowerCase());
    keyMap.set(col.key, match?.key ?? col.key);
  }
  return (custom) => Object.fromEntries(Object.entries(custom).map(([k, v]) => [keyMap.get(k) ?? k, v]));
}

/** «Se creó 1 campo propio en productos.» — for the import result screen. */
export function newColumnsNote(count: number, entityPlural: string): string | null {
  if (count === 0) return null;
  return count === 1 ? `Se creó 1 campo propio en ${entityPlural}.` : `Se crearon ${count} campos propios en ${entityPlural}.`;
}
