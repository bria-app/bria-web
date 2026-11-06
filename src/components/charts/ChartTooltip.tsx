"use client";

import { formatNumber } from "@/lib/format";

interface TooltipEntry {
  dataKey?: string | number;
  value?: unknown;
  color?: string;
}

/** Tooltip shared by the recharts charts. `names` picks which series show; `format` maps (dataKey, value) to text. */
export function ChartTooltip({
  active,
  payload,
  label,
  names,
  format,
  labelFormat,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  names: Record<string, string>;
  format?: (key: string, value: unknown) => string;
  labelFormat?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value != null && names[String(p.dataKey)]);
  if (!rows.length) return null;
  return (
    <div className="min-w-[170px] rounded-xl border border-border bg-surface px-3.5 py-3 shadow-[0_8px_24px_rgb(var(--shadow-color)/0.12)]">
      <p className="mb-2 text-xs font-semibold text-text-muted">{labelFormat ? labelFormat(String(label)) : label}</p>
      <div className="space-y-1.5">
        {rows.map((entry) => {
          const key = String(entry.dataKey);
          const v = entry.value;
          const text = format
            ? format(key, v)
            : Array.isArray(v)
              ? `${formatNumber(Number(v[0]))} – ${formatNumber(Number(v[1]))}`
              : formatNumber(Number(v));
          return (
            <div key={key} className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-2 text-xs text-text-secondary">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                {names[key]}
              </span>
              <span className="font-mono text-xs font-semibold text-text-primary">{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Legend item: a swatch (solid or dashed) and its label. */
export function LegendChip({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary">
      <span
        aria-hidden
        className="w-4 rounded-full"
        style={dashed ? { borderTop: `2px dashed ${color}`, height: 0 } : { background: color, height: 3 }}
      />
      {label}
    </span>
  );
}
