"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePageFlow } from "@/hooks/useDevicePref";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";
import type { TodoItem } from "./types";

/** A card a third or half wide stacks what's pending: two keep it as tall as its neighbours. */
const FIRST_NARROW = 2;
/** Wide, they go side by side. */
const FIRST_WIDE = 3;
/** With the page going sideways the card gets a whole column's height: room for a few more. */
const FIRST_SIDEWAYS = 5;

interface TodoWidgetProps {
  items: TodoItem[];
  /** Columns of 12 the card takes. */
  span: number;
  laterIds: string[];
  onLater: (id: string) => void;
  onShowLater: () => void;
}

/** «Para hoy»: what needs the owner today, each with its action and «Luego». */
export function TodoWidget({ items, span, laterIds, onLater, onShowLater }: TodoWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [pageFlow] = usePageFlow();
  const first = pageFlow === "lado" ? FIRST_SIDEWAYS : span <= 6 ? FIRST_NARROW : FIRST_WIDE;
  const later = new Set(laterIds);
  const open = items.filter((i) => !later.has(i.id));
  const snoozed = items.length - open.length;
  const shown = expanded ? open : open.slice(0, first);
  const note = open.length === 1 ? "1 pendiente" : `${open.length} pendientes`;

  return (
    <WidgetCard title="Para hoy" note={open.length ? note : undefined}>
      <div className="flex flex-1 flex-col gap-2">
        {open.length === 0 ? (
          <WidgetEmpty>{snoozed > 0 ? "Nada más por ahora." : "Nada urgente. Buen día para vender."}</WidgetEmpty>
        ) : (
          <ul className="grid flex-1 auto-rows-fr gap-2 @3xl:grid-cols-3">
            {shown.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 rounded-xl bg-surface-soft p-3.5">
                <div className="flex min-w-0 items-start gap-2">
                  <Badge tone={item.tone} className="mt-px">
                    {item.pill}
                  </Badge>
                  <Link href={item.productHref} className="min-w-0 text-sm font-semibold text-text-primary hover:underline">
                    {item.title}
                  </Link>
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">{item.why}</p>
                <div className="mt-auto flex gap-2">
                  <Link href={item.cta.href} className="btn btn-strong h-9 gap-1.5 px-3 text-[13px]">
                    {item.cta.label}
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => onLater(item.id)}>
                    Luego
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {open.length > first && (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? "Ver menos" : `Ver ${open.length - first} más`}
          </Button>
        )}
        {snoozed > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-text-muted">
            {snoozed === 1 ? "Dejaste 1 para luego." : `Dejaste ${snoozed} para luego.`}
            <button type="button" onClick={onShowLater} className="rounded font-semibold text-accent-text hover:underline">
              Volver a mostrar
            </button>
          </p>
        )}
      </div>
    </WidgetCard>
  );
}
