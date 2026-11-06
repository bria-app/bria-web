"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/services/api/client";
import { recommendationsApi } from "@/services/api/resources";
import { formatNumber, plural, soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OverviewProduct } from "@/types/forecasting";
import { isToBuy } from "./decisions";
import { methodName } from "./labels";

function urgency(p: OverviewProduct): { label: string; tone: BadgeTone } {
  if (p.on_hand <= 0) return { label: "Agotado", tone: "danger" };
  if (p.stockout_risk === "alto") return { label: "Urgente", tone: "danger" };
  if (p.stockout_risk === "medio") return { label: "Pronto", tone: "warning" };
  return { label: "Próximo pedido", tone: "neutral" };
}

function why(p: OverviewProduct, expert: boolean): string {
  const cover = p.coverage_days != null ? Math.round(p.coverage_days) : null;
  if (expert) {
    return `Cobertura ${cover ?? "—"} d · demora del proveedor ${p.lead_time_days} d · inventario de seguridad ${p.safety_stock} u · ${methodName(p.model_used, true)}`;
  }
  const left =
    p.on_hand <= 0
      ? "Se te acabó"
      : cover == null
        ? `Te quedan ${formatNumber(p.on_hand)} u`
        : cover > 90
          ? "Te alcanza para más de 3 meses"
          : cover < 1
            ? "Te alcanza para menos de un día"
            : `Te alcanza para unos ${plural(cover, "día", "días")}`;
  return `${left}; tu proveedor demora ${plural(p.lead_time_days, "día", "días")}.`;
}

/**
 * «Qué comprar»: this run's restock suggestions, to tick and turn into a purchase. `onReload`
 * fetches the suggestions again (after one was dismissed or replaced by a newer forecast).
 */
export function BuyTab({
  companyId,
  products,
  expert,
  onReload,
}: {
  companyId: string;
  products: OverviewProduct[];
  expert: boolean;
  onReload: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [off, setOff] = useState<Set<string>>(() => new Set());
  const [working, setWorking] = useState(false);
  // Same call as each product's advice card: a slow mover the card says not to restock
  // never shows up here as a purchase.
  const items = products.filter(isToBuy);
  const chosen = items.filter((p) => !off.has(p.product_id));
  const total = chosen.reduce((a, p) => a + p.suggested_investment, 0);

  const toggle = (id: string) =>
    setOff((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const listText = () => chosen.map((p) => `${p.name} (${p.sku}): ${formatNumber(p.suggested_qty)} u`).join("\n");

  const copy = () => {
    navigator.clipboard
      .writeText(listText())
      .then(() => toast("Lista copiada. Pégala en tu pedido o en WhatsApp."))
      .catch(() => toast("Tu navegador no dejó copiar la lista. Inténtalo de nuevo."));
  };

  // Marks the suggestions as «voy a comprar» (the API does not create the purchase) and opens
  // the purchase form with these products and quantities already filled in. Accepting is
  // idempotent, so a retry after a partial failure may send the same ids again.
  const build = async () => {
    setWorking(true);
    const ids = chosen.map((p) => p.recommendation_id).filter((id): id is string => id != null);
    const done = await Promise.allSettled(ids.map((id) => recommendationsApi.accept(companyId, id)));
    const failed = done.flatMap((d) => (d.status === "rejected" ? [d.reason as unknown] : []));
    if (failed.length > 0) {
      setWorking(false);
      // 409: a suggestion was dismissed or replaced by a newer forecast; the API says which.
      const conflict = failed.find((e): e is ApiError => e instanceof ApiError && e.status === 409);
      if (conflict) {
        toast(conflict.message);
        onReload();
      } else {
        toast("No se pudieron marcar todas las sugerencias. Inténtalo de nuevo.");
      }
      return;
    }
    const query = new URLSearchParams();
    chosen.forEach((p) => {
      query.append("product", p.product_id);
      query.append("cantidad", String(Math.ceil(p.suggested_qty)));
    });
    // Stays «working» until the purchase form opens, so it cannot be sent twice.
    router.push(`/purchases/new?${query.toString()}`);
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Nada que comprar por ahora"
        description="Con tu inventario de hoy te alcanza para lo que calculaste."
      />
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((p) => {
          const on = !off.has(p.product_id);
          const u = urgency(p);
          return (
            <li key={p.product_id}>
              <label
                className={cn(
                  "flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border bg-surface p-4 transition-colors sm:p-5",
                  on ? "border-accent-line" : "border-border",
                )}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(p.product_id)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/25",
                    on ? "border-primary bg-primary text-on-primary" : "border-border",
                  )}
                >
                  {on && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <Badge tone={u.tone}>{u.label}</Badge>
                <span className="flex min-w-0 flex-[1_1_240px] flex-col">
                  <span className="font-semibold text-text-primary">{p.name}</span>
                  <span className="text-sm text-text-muted">{why(p, expert)}</span>
                </span>
                <span className="font-mono text-xl text-text-primary">{formatNumber(p.suggested_qty)} u</span>
                <span className="w-28 text-right font-mono text-text-secondary">{soles(p.suggested_investment)}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="pointer-events-none sticky bottom-[-2rem] z-10 -mt-3 bg-gradient-to-t from-background from-65% to-transparent pb-4 pt-8">
      <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-3">
        <span className="flex-1 text-sm text-text-secondary">
          {chosen.length ? (
            <>
              <span className="font-semibold text-text-primary">
                {chosen.length} {chosen.length === 1 ? "producto" : "productos"}
              </span>{" "}
              · <span className="font-mono text-text-primary">{soles(total)}</span> a costo promedio
            </>
          ) : (
            "Marca lo que quieras pedir"
          )}
        </span>
        <Button variant="secondary" onClick={copy} disabled={!chosen.length}>
          Copiar lista
        </Button>
        <Button variant="strong" onClick={() => void build()} disabled={!chosen.length} loading={working}>
          Armar compra
        </Button>
      </div>
      </div>
    </div>
  );
}
