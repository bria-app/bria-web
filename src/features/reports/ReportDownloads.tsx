"use client";

import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataState } from "@/components/ui/DataState";
import { useToast } from "@/components/ui/Toast";
import { useApi } from "@/hooks/useApi";
import { reportsApi } from "@/services/api/resources";
import { dateTime, shortDate, toDate } from "@/lib/format";
import { limaDate } from "@/lib/lima";
import { triggerDownload } from "@/lib/utils";
import type { ReportStatus, ReportType } from "@/types/api";

const KINDS: { type: ReportType; title: string; desc: string }[] = [
  { type: "forecast", title: "Pronóstico por producto", desc: "Lo que venderás de cada producto, periodo a periodo, con el método usado." },
  { type: "kpi", title: "Mis números", desc: "Cuánto te dura el inventario de cada producto y cuáles se acaban." },
  { type: "recommendation", title: "Qué comprar", desc: "Las cantidades que te conviene pedir, con el motivo." },
];
const titleOf = (t: ReportType) => KINDS.find((k) => k.type === t)?.title ?? "Reporte";

const STATUS: Record<ReportStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Generando", tone: "warning" },
  ready: { label: "Listo", tone: "success" },
  failed: { label: "No se pudo generar", tone: "danger" },
};

/** Milliseconds of an API timestamp; missing or malformed dates sort as the oldest. */
function stamp(at: string | null): number {
  if (!at) return -Infinity;
  const t = toDate(at).getTime();
  return Number.isNaN(t) ? -Infinity : t;
}

/** Files built from your real data: generate one now, or download one made before. */
export function ReportDownloads({ companyId }: { companyId: string }) {
  const toast = useToast();
  const reports = useApi(() => reportsApi.list(companyId), [companyId]);
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (id: string) => {
    const { blob, filename } = await reportsApi.download(companyId, id);
    triggerDownload(blob, filename);
  };

  const run = async (key: string, task: () => Promise<void>) => {
    setBusy(key);
    try {
      await task();
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo descargar el archivo. Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  const generate = (type: ReportType) =>
    run(type, async () => {
      try {
        const title = `${titleOf(type)} · ${shortDate(limaDate(new Date()))}`;
        const report = await reportsApi.create(companyId, { title, report_type: type });
        if (report.status !== "ready") throw new Error("El archivo no se pudo generar. Inténtalo de nuevo.");
        await download(report.id);
      } finally {
        // Even a failed attempt may leave a row in «Generados antes».
        reports.reload();
      }
    });

  // Newest first; rows without a date (not stored yet) go last.
  const items = [...(reports.data?.items ?? [])].sort((a, b) => stamp(b.created_at) - stamp(a.created_at));

  return (
    <section aria-labelledby="descargas" className="space-y-4">
      <div>
        <h2 id="descargas" className="font-display text-lg font-bold text-text-primary">
          Descargas
        </h2>
        <p className="text-sm text-text-secondary">
          Se arman al momento con tus datos. Por ahora salen en formato JSON, no en PDF ni Excel.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {KINDS.map((k) => (
          <Card key={k.type} className="flex min-w-0 flex-col gap-2 p-5">
            <h3 className="font-semibold text-text-primary">{k.title}</h3>
            <p className="mb-2 text-sm text-text-secondary">{k.desc}</p>
            <Button variant="secondary" className="mt-auto" onClick={() => void generate(k.type)} loading={busy === k.type} disabled={busy != null}>
              Descargar
            </Button>
          </Card>
        ))}
      </div>

      <DataState loading={reports.loading && !reports.data} error={reports.error} onRetry={reports.reload}>
        {items.length > 0 && (
          <Card className="overflow-hidden p-0">
            <h3 className="bg-surface-soft px-5 py-3 text-[12px] font-semibold text-text-muted">Generados antes</h3>
            <ul>
              {items.map((r) => {
                const s = STATUS[r.status] ?? STATUS.pending;
                return (
                  <li key={r.id} className="flex min-h-[52px] flex-wrap items-center gap-3 border-t border-border px-5 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-primary">{r.title}</span>
                      <span className="text-xs text-text-muted">
                        {titleOf(r.report_type)}
                        {r.created_at && <> · {dateTime(r.created_at)}</>}
                      </span>
                    </span>
                    <Badge tone={s.tone}>{s.label}</Badge>
                    {r.status === "ready" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void run(r.id, () => download(r.id))}
                        loading={busy === r.id}
                        disabled={busy != null}
                        aria-label={`Descargar ${r.title}`}
                      >
                        Descargar
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </DataState>
    </section>
  );
}
