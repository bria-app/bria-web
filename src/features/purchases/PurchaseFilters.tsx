"use client";

import { Search } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { DateRangeChip } from "@/components/ui/DateRangeChip";
import { Select, type SelectOption } from "@/components/ui/Select";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { inputClass } from "@/lib/ui";
import { shiftDate } from "@/lib/lima";
import { todayISO } from "./format";

export type Period = "all" | "month" | "last" | "custom";

export interface PurchaseFilterState {
  search: string;
  supplierId: string;
  period: Period;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: PurchaseFilterState = { search: "", supplierId: "", period: "all", from: "", to: "" };

const PERIODS: { value: Period; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "month", label: "Este mes" },
  { value: "last", label: "Mes pasado" },
];

/** The date range the API receives for a period chip (months of the Lima calendar). */
export function periodRange(f: PurchaseFilterState): { date_from?: string; date_to?: string } {
  const monthStart = `${todayISO().slice(0, 7)}-01`;
  if (f.period === "month") return { date_from: monthStart };
  if (f.period === "last") {
    const lastMonthEnd = shiftDate(monthStart, -1);
    return { date_from: `${lastMonthEnd.slice(0, 7)}-01`, date_to: lastMonthEnd };
  }
  if (f.period === "custom") return { date_from: f.from || undefined, date_to: f.to || undefined };
  return {};
}

interface Props {
  value: PurchaseFilterState;
  onChange: (next: PurchaseFilterState) => void;
  supplierOptions: SelectOption[];
}

/**
 * Search, supplier and period filters of the purchases list. They arrange by the width they get:
 * the search and the view switch always share a line, and with room everything fits on one.
 */
export function PurchaseFilters({ value, onChange, supplierOptions }: Props) {
  const set = (patch: Partial<PurchaseFilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="@container">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block min-w-0 flex-1 basis-0 @3xl:w-80 @3xl:flex-none @3xl:basis-auto">
          <span className="sr-only">Buscar compras</span>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            className={inputClass(false, "pl-10")}
            placeholder="N.º de comprobante o proveedor"
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
          />
        </label>
        <div className="order-1 w-full min-w-0 @3xl:order-none @3xl:w-72">
          <Select
            aria-label="Proveedor"
            value={value.supplierId}
            onChange={(supplierId) => set({ supplierId })}
            options={supplierOptions}
            searchable
            emptyText="Ningún proveedor coincide"
          />
        </div>
        <div className="order-2 flex w-full flex-wrap items-center gap-2 @6xl:order-none @6xl:w-auto" role="group" aria-label="Periodo">
          {PERIODS.map((p) => (
            <Chip key={p.value} active={value.period === p.value} onClick={() => set({ period: p.value })}>
              {p.label}
            </Chip>
          ))}
          <DateRangeChip active={value.period === "custom"} from={value.from} to={value.to} onSelect={() => set({ period: "custom" })} onChange={set} />
        </div>
        <ViewToggle screen="compras" className="ml-auto" />
      </div>
    </div>
  );
}
