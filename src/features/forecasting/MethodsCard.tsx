import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OverviewProduct } from "@/types/forecasting";
import { methodName } from "./labels";

/** Which method won in how many products, plus the honest note on accuracy. */
export function MethodsCard({
  products,
  accuracy,
  expert,
}: {
  products: OverviewProduct[];
  accuracy: number | null | undefined;
  expert: boolean;
}) {
  const forecast = products.filter((p) => p.status !== "skipped");
  const counts = new Map<string, number>();
  for (const p of forecast) counts.set(p.model_used, (counts.get(p.model_used) ?? 0) + 1);
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h3 className="font-semibold text-text-primary">Qué método ganó en cada producto</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">Ningún producto tuvo datos para pronosticar.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(([model, n], i) => (
            <li key={model} className="space-y-1">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-text-primary">{methodName(model, expert)}</span>
                <span className="font-mono text-text-secondary">
                  {formatNumber(n)} {n === 1 ? "producto" : "productos"}
                </span>
              </span>
              <span aria-hidden className="block h-1.5 rounded-full bg-surface-muted">
                <span
                  className={cn("block h-1.5 rounded-full", i === 0 ? "bg-primary" : "bg-text-secondary/45")}
                  style={{ width: `${Math.max(4, Math.round((n / forecast.length) * 100))}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto space-y-1 text-xs text-text-muted">
        {accuracy != null && (
          <p>
            {expert ? "Precisión media ponderada: " : "En tus ventas pasadas acertó en promedio "}
            <span className="font-mono font-semibold text-text-primary">{formatNumber(accuracy)} %</span> (puede ser optimista).
          </p>
        )}
        {expert && <p>Los métodos compiten en validación con origen móvil; gana el de menor error en cada producto.</p>}
      </div>
    </Card>
  );
}
