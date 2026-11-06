"use client";

import { useRouter } from "next/navigation";
import type { BuiltinColumn } from "@/features/custom-fields/ColumnsManager";
import { formatCustomValue } from "@/features/custom-fields/CustomFieldInput";
import { ListStatus } from "@/components/ui/ListStatus";
import { ScrollShadow } from "@/components/ui/ScrollShadow";
import { cn } from "@/lib/utils";
import type { SupplierDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { RIGHT_ALIGNED, SupplierFolded, supplierCell, supplierCellClass } from "./supplierColumns";

interface Props {
  rows: SupplierDTO[];
  columns: BuiltinColumn[];
  customColumns: CustomFieldDTO[];
  footer: React.ReactNode;
}

const FIRST = "w-full max-w-0 pl-4 sm:pl-5";

/**
 * Suppliers with the columns the company chose. A row opens the supplier's page.
 * The built-in set fits the width without scrolling (columns step in by breakpoint); the
 * company's own fields show from 2xl up (~1200 px) and may scroll sideways when many are turned on.
 */
export function SuppliersTable({ rows, columns, customColumns, footer }: Props) {
  const router = useRouter();
  const shown = new Set(columns.map((c) => c.key));

  return (
    <div className="overflow-clip rounded-2xl border border-border bg-surface">
      <ScrollShadow hint="Desliza para ver más columnas">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-soft">
            <tr className="text-[12px] font-semibold text-text-muted">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn("whitespace-nowrap px-3 py-3", supplierCellClass(c.key), c.key === "business_name" && "pl-4 sm:pl-5", RIGHT_ALIGNED.has(c.key) && "text-right")}
                >
                  {c.label}
                </th>
              ))}
              {customColumns.map((f) => (
                <th key={f.id} scope="col" className="hidden whitespace-nowrap px-3 py-3 2xl:table-cell">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.id}
                onClick={() => router.push(`/suppliers/${s.id}`)}
                className={cn("h-[52px] cursor-pointer border-t border-border transition-colors hover:bg-surface-soft", !s.is_active && "text-text-muted")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-3 py-2.5", supplierCellClass(c.key), c.key === "business_name" && FIRST, RIGHT_ALIGNED.has(c.key) && "text-right")}
                  >
                    {supplierCell(c.key, s)}
                    {c.key === "business_name" && <SupplierFolded s={s} shown={shown} />}
                  </td>
                ))}
                {customColumns.map((f) => {
                  const v = s.custom_attributes?.[f.key];
                  const empty = v === undefined || v === null || v === "";
                  const numeric = f.field_type === "number" || f.field_type === "currency";
                  return (
                    <td
                      key={f.id}
                      className={cn("hidden px-3 py-2.5 2xl:table-cell", empty ? "text-text-muted" : "text-text-secondary", numeric && "whitespace-nowrap font-mono")}
                    >
                      <span className="block max-w-[140px] truncate">{formatCustomValue(f, v)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollShadow>
      <ListStatus variant="table">{footer}</ListStatus>
    </div>
  );
}
