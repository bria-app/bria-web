/**
 * Holds a chart's space while its code (recharts) loads on demand, so the layout doesn't jump.
 * `height` is the whole chart block: legend row included when the chart draws one.
 */
export function ChartPlaceholder({ height }: { height: number }) {
  return <div aria-hidden className="skeleton w-full rounded-xl" style={{ height }} />;
}
