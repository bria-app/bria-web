"use client";

import { useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { CustomizePanel } from "@/features/dashboard/CustomizePanel";
import { HomeGrid } from "@/features/dashboard/HomeGrid";
import { buildActivity } from "@/features/dashboard/activity";
import { buildBrief, firstName } from "@/features/dashboard/brief";
import { buildTodo } from "@/features/dashboard/buildTodo";
import { LATER_KEY, LAYOUT_KEY, parseLater, parseLayout } from "@/features/dashboard/layout";
import { greeting, longDate } from "@/lib/lima";
import type { HomeLayout } from "@/features/dashboard/types";
import { useCompanyPreference } from "@/hooks/useCompanyPreference";
import { useHomeData } from "@/features/dashboard/useHomeData";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useProfile } from "@/hooks/useProfile";

const errorText = (err: unknown) => (err instanceof Error ? err.message : "Inténtalo de nuevo.");

export default function TodayPage() {
  const companyId = useCompanyId();
  const { user } = useProfile();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const { summary, cash, stock, activity } = useHomeData(companyId);

  const s = summary.data;
  const today = cash.data?.today ?? s?.today ?? null;
  const layout = useCompanyPreference(companyId, LAYOUT_KEY, parseLayout);
  const later = useCompanyPreference(companyId, LATER_KEY, (raw) => parseLater(raw, today));

  const todo = useMemo(() => (stock.data ? buildTodo(stock.data.products, stock.data.recs, s) : []), [stock.data, s]);
  const feed = useMemo(() => {
    if (!activity.data) return [];
    const names = new Map((stock.data?.products ?? []).map((p) => [p.id, p.name]));
    return buildActivity(activity.data, names);
  }, [activity.data, stock.data]);

  const saveLayout = (next: HomeLayout) =>
    layout.save(next).catch((err: unknown) => toast(`No se guardó el orden. ${errorText(err)}`));

  const resetLayout = () => {
    const previous = layout.value;
    void layout
      .save(parseLayout(null))
      .then(() => toast("Volviste al orden original", { undo: () => void saveLayout(previous) }))
      .catch((err: unknown) => toast(`No se restableció. ${errorText(err)}`));
  };

  const saveLater = (ids: string[], message: string, undoIds: string[]) => {
    if (!today) return;
    void later
      .save({ date: today, ids })
      .then(() =>
        toast(message, {
          undo: () => void later.save({ date: today, ids: undoIds }).catch((err: unknown) => toast(errorText(err))),
        }),
      )
      .catch((err: unknown) => toast(`No se guardó. ${errorText(err)}`));
  };
  const laterIds = later.value.ids;
  const onLater = (id: string) => saveLater([...laterIds, id], "Lo verás mañana", laterIds);
  const onShowLater = () => saveLater([], "Volvieron a tu lista", laterIds);

  const name = firstName(user?.full_name);
  const title = cash.data ? `${greeting(cash.data.fetchedAt)}${name ? `, ${name}` : ""}` : name ? `Hola, ${name}` : "Hoy";
  const brief = buildBrief(cash.data, s);
  const description = today ? [longDate(today), brief].filter(Boolean).join(" · ") : undefined;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={
          // Stays in place while customizing, so the title doesn't move; «Listo» is on the floating bar.
          <Button variant="secondary" size="sm" className={editing ? "invisible" : undefined} onClick={() => setEditing(true)} disabled={layout.loading}>
            Personalizar
          </Button>
        }
      />

      {editing && <CustomizePanel layout={layout.value} onChange={(next) => void saveLayout(next)} onReset={resetLayout} onDone={() => setEditing(false)} />}

      {s && s.active_products === 0 && (
        <EmptyState
          icon={PackagePlus}
          title="Empieza con tus productos"
          description="Carga tus productos y cuánto tienes de cada uno. Con eso, aquí verás tu caja, lo que se acaba y lo que más sale."
          action={{ label: "Importar inventario", href: "/inventory/import" }}
        />
      )}

      <HomeGrid
        layout={layout.value}
        editing={editing}
        onLayoutChange={(next) => void saveLayout(next)}
        today={today ?? ""}
        summary={summary}
        cash={cash}
        todo={{ items: todo, loading: !stock.data && !stock.error, error: stock.error, reload: stock.reload }}
        activity={{ items: feed, loading: !activity.data && !activity.error, error: activity.error, reload: activity.reload }}
        laterIds={laterIds}
        onLater={onLater}
        onShowLater={onShowLater}
      />
    </div>
  );
}
