"use client";

import { Search } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { DateRangeChip } from "@/components/ui/DateRangeChip";
import { Select, type SelectOption } from "@/components/ui/Select";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { inputClass } from "@/lib/ui";
import { presetRange, RANGE_LABEL, type RangePreset } from "@/features/pos/dates";
import { DOCUMENT_LABEL, type OrderStatus, type SalesDocumentType } from "@/types/pos";

type Period = RangePreset | "custom";

export interface SalesFilterValue {
  period: Period;
  from: string;
  to: string;
  docType: "" | SalesDocumentType;
  status: "" | OrderStatus;
  sellerId: string;
  search: string;
}

interface SalesFiltersProps {
  value: SalesFilterValue;
  onChange: (patch: Partial<SalesFilterValue>) => void;
  onPreset: (preset: RangePreset) => void;
  /** Only owners and admins filter by seller; sellers already see only their own sales. */
  sellerOptions?: SelectOption[];
}

const PRESETS = Object.keys(RANGE_LABEL) as RangePreset[];
const DOCS = Object.keys(DOCUMENT_LABEL) as SalesDocumentType[];
const STATUS: { value: "" | OrderStatus; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "completed", label: "Pagadas" },
  { value: "voided", label: "Anuladas" },
];

/**
 * Filters the sales-orders endpoint supports: period, comprobante, status, seller and text. They
 * arrange by the width they get (a whole row, or one column of the sideways page), so the search
 * and the view switch always share a line and no row is left half empty.
 */
export function SalesFilters({ value, onChange, onPreset, sellerOptions }: SalesFiltersProps) {
  return (
    <div data-sw-side="" className="@container flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-0 @5xl:w-80 @5xl:flex-none @5xl:basis-auto">
          <span className="sr-only">Buscar venta</span>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={value.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Cliente, DNI o RUC, número o vendedor"
            className={inputClass(false, "pl-10")}
          />
        </label>
        <div role="group" aria-label="Periodo" className="order-last flex w-full flex-wrap gap-1.5 @5xl:order-none @5xl:w-auto">
          {PRESETS.map((p) => (
            <Chip key={p} active={value.period === p} onClick={() => onPreset(p)}>
              {RANGE_LABEL[p]}
            </Chip>
          ))}
          <DateRangeChip
            active={value.period === "custom"}
            from={value.from}
            to={value.to}
            // From «Todo» there is no period to start from (its range goes back to the year 2000).
            onSelect={() => onChange(value.period === "all" ? { period: "custom", ...presetRange("30d") } : { period: "custom" })}
            onChange={onChange}
          />
        </div>
        <ViewToggle screen="ventas" className="ml-auto" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div role="group" aria-label="Comprobante" className="flex flex-wrap gap-1.5">
          <Chip active={value.docType === ""} onClick={() => onChange({ docType: "" })}>
            Todos los comprobantes
          </Chip>
          {DOCS.map((d) => (
            <Chip key={d} active={value.docType === d} onClick={() => onChange({ docType: d })}>
              {DOCUMENT_LABEL[d]}
            </Chip>
          ))}
        </div>
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-border @5xl:block" />
        <div role="group" aria-label="Estado" className="flex flex-wrap gap-1.5">
          {STATUS.map((s) => (
            <Chip key={s.value || "all"} active={value.status === s.value} onClick={() => onChange({ status: s.value })}>
              {s.label}
            </Chip>
          ))}
        </div>
        {sellerOptions && (
          <div className="ml-auto min-w-40 flex-1 @5xl:w-56 @5xl:flex-none">
            <Select value={value.sellerId} onChange={(sellerId) => onChange({ sellerId })} options={sellerOptions} aria-label="Vendedor" />
          </div>
        )}
      </div>
    </div>
  );
}
