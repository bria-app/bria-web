"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { presetRange } from "@/features/pos/dates";
import { useApi } from "@/hooks/useApi";
import { initialsOf } from "@/hooks/useProfile";
import { dateTime, formatNumber, percent, plural, soles, timeAgo } from "@/lib/format";
import { posApi } from "@/services/api/pos";
import { usersApi } from "@/services/api/users";
import type { UserDTO } from "@/types/api";
import { roleInfo } from "./roles";

type Period = "month" | "30d" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "Este mes" },
  { value: "30d", label: "30 días" },
  { value: "all", label: "Todo" },
];

interface MemberSheetProps {
  user: UserDTO | null;
  companyId: string;
  /** Owner/admin may rename this person. */
  canRename: boolean;
  onClose: () => void;
  onChanged: () => void;
}

/** One person of the team: how they sell, what they sell most and their latest tickets. */
export function MemberSheet({ user, companyId, canRename, onClose, onChanged }: MemberSheetProps) {
  return (
    <Sheet open={user !== null} onClose={onClose} label={user ? `Ficha de ${user.full_name}` : "Ficha"}>
      {user && <MemberBody key={user.id} user={user} companyId={companyId} canRename={canRename} onClose={onClose} onChanged={onChanged} />}
    </Sheet>
  );
}

function MemberBody({ user, companyId, canRename, onClose, onChanged }: Omit<MemberSheetProps, "user"> & { user: UserDTO }) {
  const [period, setPeriod] = useState<Period>("month");
  const range = presetRange(period);
  const params = { date_from: range.from, date_to: range.to };
  const mine = useApi(() => posApi.summary(companyId, { ...params, seller_id: user.id }), [companyId, user.id, period]);
  const all = useApi(() => posApi.summary(companyId, params), [companyId, period]);
  const tickets = useApi(() => posApi.list(companyId, { seller_id: user.id, size: 6 }), [companyId, user.id]);

  const s = mine.data;
  const companyTotal = Number(all.data?.revenue ?? 0);
  const share = s && companyTotal > 0 ? Number(s.revenue) / companyTotal : null;
  const role = roleInfo(user.role);

  return (
    <>
      <header className="relative shrink-0 border-b border-border px-6 pb-5 pt-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl text-text-muted hover:bg-surface-muted hover:text-text-primary"
        >
          <X aria-hidden className="h-[18px] w-[18px]" />
        </button>
        <div className="flex items-center gap-4 pr-8">
          <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface-muted text-[16px] font-bold text-text-secondary">
            {initialsOf(user.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <NameLine user={user} companyId={companyId} canRename={canRename} onChanged={onChanged} />
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-text-muted">
              <Badge tone={role.tone}>{role.label}</Badge>
              <span className="min-w-0 font-mono [overflow-wrap:anywhere]">{user.username ?? user.email}</span>
              <span aria-hidden>·</span>
              <span>{user.last_login_at ? `Entró ${timeAgo(user.last_login_at)}` : "Nunca entró"}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-text-primary">Cómo vende</h3>
          <Segmented<Period> label="Período" size="sm" value={period} onChange={setPeriod} options={PERIODS} />
        </div>

        <DataState loading={mine.loading && !s} error={mine.error} onRetry={mine.reload}>
          {s && (
            <>
              {s.orders === 0 ? (
                <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">No cobró ninguna venta en este período.</p>
              ) : (
                <dl className="grid grid-cols-2 gap-3">
                  <Figure label="Vendió" value={soles(s.revenue)} note={share != null ? `${percent(share)} de la tienda` : undefined} />
                  <Figure label="Ventas cobradas" value={formatNumber(s.orders)} note={plural(s.units, "unidad", "unidades")} />
                  <Figure label="Ticket promedio" value={soles(s.avg_ticket)} />
                  <Figure
                    label="Anuladas"
                    value={formatNumber(s.voided_orders)}
                    note={s.voided_orders ? "Revisa el motivo en Ventas" : "Ninguna"}
                    warn={s.voided_orders > 0}
                  />
                </dl>
              )}

              {s.top_products.length > 0 && (
                <section aria-label="Lo que más vende">
                  <h4 className="mb-2 text-[13px] font-semibold text-text-secondary">Lo que más vende</h4>
                  <ol className="divide-y divide-border rounded-xl border border-border">
                    {s.top_products.slice(0, 5).map((p) => (
                      <li key={p.product_id}>
                        <Link href={`/inventory/${p.product_id}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm hover:bg-surface-soft">
                          <span className="min-w-0 truncate text-text-primary">{p.name}</span>
                          <span className="shrink-0 font-mono text-[12.5px] text-text-secondary">
                            {formatNumber(p.units)} u · {soles(p.total)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}
        </DataState>

        <section aria-label="Últimas ventas">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="text-[13px] font-semibold text-text-secondary">Últimas ventas</h4>
            <Link href={`/sales?vendedor=${user.id}`} className="text-[13px] font-semibold text-accent-text hover:underline">
              Ver todas
            </Link>
          </div>
          <DataState loading={tickets.loading && !tickets.data} error={tickets.error} onRetry={tickets.reload}>
            {tickets.data && tickets.data.items.length === 0 ? (
              <p className="text-sm text-text-muted">Todavía no cobró ninguna venta.</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {tickets.data?.items.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="block font-mono text-[12.5px] text-text-primary">{o.document_number}</span>
                      <span className="block text-[12px] text-text-muted">{dateTime(o.sold_at)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {o.status === "voided" && <Badge tone="danger">Anulada</Badge>}
                      <span className="font-mono text-[13px] text-text-primary">{soles(o.total)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </section>
      </div>
    </>
  );
}

function Figure({ label, value, note, warn }: { label: string; value: string; note?: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <dt className="text-[12.5px] text-text-secondary">{label}</dt>
      <dd className={warn ? "font-mono text-[19px] font-semibold text-warning" : "font-mono text-[19px] font-semibold text-text-primary"}>{value}</dd>
      {note && <dd className="text-[12px] text-text-muted">{note}</dd>}
    </div>
  );
}

/** The name, and an inline field to change it. */
function NameLine({ user, companyId, canRename, onChanged }: { user: UserDTO; companyId: string; canRename: boolean; onChanged: () => void }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.full_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = name.trim();
    if (!next) return setError("Escribe su nombre.");
    if (next === user.full_name) return setEditing(false);
    setSaving(true);
    setError(null);
    try {
      await usersApi.update(companyId, user.id, { full_name: next });
      onChanged();
      toast(`Ahora se llama «${next}».`);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el nombre.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5">
        <h2 className="truncate font-display text-[21px] font-bold leading-tight tracking-[-0.02em] text-text-primary">{name}</h2>
        {canRename && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Cambiar el nombre de ${name}`}
            title="Cambiar nombre"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <Pencil aria-hidden className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
  return (
    <form onSubmit={save} noValidate className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <TextField label="Nombre" hideLabel value={name} onChange={(e) => setName(e.target.value)} error={error} autoFocus maxLength={120} />
      </div>
      <Button type="submit" variant="strong" loading={saving}>Guardar</Button>
      <Button
        variant="ghost"
        onClick={() => {
          setName(user.full_name);
          setError(null);
          setEditing(false);
        }}
      >
        Cancelar
      </Button>
    </form>
  );
}
