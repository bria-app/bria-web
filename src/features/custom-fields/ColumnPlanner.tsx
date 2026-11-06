"use client";

import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ColumnForm } from "./ColumnForm";
import { ColumnPickCard } from "./ColumnPickCard";
import { blankDraft } from "./columnDraft";
import type { ColumnPlan } from "./useColumnPlan";

/** The planned columns as cards, a «Crear una columna» card, and the editor for the one open. */
export function ColumnPlanner({ plan }: { plan: ColumnPlan }) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const { editing, editingCard } = plan;

  // The editor opens under the cards: bring it into view.
  useEffect(() => {
    if (editing) panelRef.current?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [editing, reduced]);

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {plan.cards.map((c) => (
          <li key={c.id}>
            <ColumnPickCard
              draft={c.draft}
              kind={c.kind}
              picked={c.picked}
              hint={c.hint}
              changed={c.changed}
              editing={editing === c.id}
              onToggle={() => plan.togglePreset(c.id.slice(2))}
              onEdit={() => plan.startEdit(editing === c.id ? null : c.id)}
              onRemove={c.kind === "added" ? () => plan.remove(c.id) : undefined}
            />
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => plan.startEdit(editing === "new" ? null : "new")}
            aria-expanded={editing === "new"}
            className="flex h-full min-h-[72px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 text-[14px] font-semibold text-text-secondary transition-colors hover:border-text-muted/60 hover:bg-surface-soft hover:text-text-primary"
          >
            <Plus aria-hidden className="h-4 w-4" /> Crear una columna
          </button>
        </li>
      </ul>

      <div ref={panelRef} className="scroll-mt-24">
        {editing && (
          <ColumnForm
            key={editing}
            className="pop-in"
            title={editingCard ? `Ajustar «${editingCard.draft.label}»` : "Nueva columna"}
            initial={editingCard?.draft ?? blankDraft()}
            entity="product"
            takenLabels={plan.takenLabels}
            typeLocked={editingCard?.kind === "existing"}
            submitLabel={editingCard ? "Listo" : "Agregar columna"}
            autoFocus
            onSubmit={plan.save}
            onCancel={() => plan.startEdit(null)}
            note="Se guarda al continuar. Luego la cambias en Inventario."
          />
        )}
      </div>
    </div>
  );
}
