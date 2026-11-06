"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useApi } from "@/hooks/useApi";
import { kpisApi, productsApi } from "@/services/api/resources";
import { formatNumber, plural, timeAgo } from "@/lib/format";
import { averageCoverage, pivotKpis, stockState, type StockState } from "./kpiRows";
import { NumberTile } from "./NumberTile";
import { StockTable } from "./StockTable";

type Filter = "todos" | StockState;

const productCount = (n: number) => `${formatNumber(n)} ${n === 1 ? "producto" : "productos"}`;

/** «Mis números»: how long each product's inventory lasts against its latest forecast. */
export function StockNumbers({ companyId, expert }: { companyId: string; expert: boolean }) {
  const toast = useToast();
  const kpis = useApi(() => kpisApi.list(companyId), [companyId]);
  const products = useApi(() => productsApi.list(companyId), [companyId]);
  const [filter, setFilter] = useState<Filter>("todos");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => pivotKpis(kpis.data ?? []), [kpis.data]);
  const productOf = useMemo(() => {
    const map = new Map((products.data ?? []).map((p) => [p.id, p]));
    return (id: string) => map.get(id);
  }, [products.data]);

  const count = (s: StockState) => rows.filter((r) => stockState(r) === s).length;
  const avg = averageCoverage(rows);
  const latest = rows.reduce<string | null>((a, r) => (!a || r.computedAt > a ? r.computedAt : a), null);
  const shown = filter === "todos" ? rows : rows.filter((r) => stockState(r) === filter);

  const recalc = async () => {
    setWorking(true);
    setError(null);
    try {
      await kpisApi.calculate(companyId);
      kpis.reload();
      toast("Números actualizados con tu inventario de hoy.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron actualizar los números. Inténtalo de nuevo.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <section aria-labelledby="mis-numeros" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="mis-numeros" className="font-display text-lg font-bold text-text-primary">
            Mis números
          </h2>
          <p className="text-sm text-text-secondary">
            Cuánto te dura el inventario, comparado con lo que el pronóstico dice que venderás.
            {latest && ` Calculado ${timeAgo(latest)}.`}
          </p>
        </div>
        {/* Without a forecast there is nothing to recalculate: the empty state points there instead. */}
        {rows.length > 0 && (
          <Button variant="secondary" onClick={() => void recalc()} loading={working}>
            Actualizar mis números
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <DataState
        loading={kpis.loading && !kpis.data}
        error={kpis.error}
        onRetry={kpis.reload}
        empty={rows.length === 0}
        emptyState={
          <EmptyState
            icon={BarChart3}
            title="Aún no hay números"
            description="Aparecen solos cuando calculas un pronóstico: se comparan tus ventas previstas con tu inventario."
            action={{ label: "Ir a Pronóstico", href: "/forecasting" }}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NumberTile
            label={expert ? "Cobertura media" : "En promedio te alcanza"}
            value={avg == null ? "—" : plural(avg, "día", "días")}
            note="Productos con ventas previstas"
          />
          <NumberTile label={expert ? "Riesgo de quiebre" : "Por acabarse"} value={productCount(count("se_acaba"))} note="No te alcanza hasta tu próximo pedido" />
          <NumberTile label={expert ? "Exceso de inventario" : "Tienes de más"} value={productCount(count("de_sobra"))} note="Más de 4 meses de venta" />
          <NumberTile label="En orden" value={productCount(count("en_orden"))} note={`De ${rows.length} medidos`} />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar productos">
          <Chip active={filter === "todos"} onClick={() => setFilter("todos")} count={rows.length}>
            Todos
          </Chip>
          <Chip active={filter === "se_acaba"} onClick={() => setFilter("se_acaba")} count={count("se_acaba")}>
            Se acaban
          </Chip>
          <Chip active={filter === "de_sobra"} onClick={() => setFilter("de_sobra")} count={count("de_sobra")}>
            De sobra
          </Chip>
        </div>

        {shown.length ? (
          <StockTable rows={shown} productOf={productOf} expert={expert} />
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-6 py-8 text-center text-sm text-text-muted">
            Ningún producto en este grupo.
          </p>
        )}
      </DataState>
    </section>
  );
}
