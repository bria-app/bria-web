"use client";

import { useState } from "react";
import { customFieldsApi } from "@/services/api/custom-fields";
import type { CustomFieldDTO } from "@/types/custom-fields";
import {
  draftFromField,
  draftFromPreset,
  hasAdvanced,
  parseOptions,
  toRules,
  type ColumnDraft,
  type ColumnPreset,
} from "./columnDraft";
import { patchFromDraft } from "./draftChecks";

export type PlanPreset = ColumnPreset & { hint?: string };

export interface PlanCard {
  id: string;
  kind: "existing" | "preset" | "added";
  draft: ColumnDraft;
  picked?: boolean;
  hint?: string;
  changed?: boolean;
}

const norm = (s: string) => s.trim().toLocaleLowerCase("es");

/**
 * Product columns planned before saving (onboarding «Ajustes»): the shop's saved ones, the
 * suggestions for its kind of shop and new ones, each open to adjust. Nothing reaches the API
 * until `apply`, and only what is ticked, new or changed is sent.
 */
export function useColumnPlan(fields: CustomFieldDTO[], presets: PlanPreset[]) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(presets.map((p) => p.label)));
  const [presetDrafts, setPresetDrafts] = useState<Record<string, ColumnDraft>>({});
  const [added, setAdded] = useState<{ id: string; draft: ColumnDraft }[]>([]);
  const [fieldEdits, setFieldEdits] = useState<Record<string, ColumnDraft>>({});
  /** A card id, «new», or null. */
  const [editing, setEditing] = useState<string | null>(null);

  const hasField = (label: string) => fields.some((f) => norm(f.label) === norm(label));
  const byId = new Map(fields.map((f) => [f.id, f]));

  const cards: PlanCard[] = [
    ...fields.map((f) => ({ id: `f:${f.id}`, kind: "existing" as const, draft: fieldEdits[f.id] ?? draftFromField(f), changed: !!fieldEdits[f.id] })),
    ...presets
      .filter((p) => !hasField(p.label))
      .map((p) => ({ id: `p:${p.label}`, kind: "preset" as const, draft: presetDrafts[p.label] ?? draftFromPreset(p), picked: picked.has(p.label), hint: p.hint })),
    // Once saved (even by a half-finished attempt), a new column shows as one the shop already has.
    ...added.filter((a) => !hasField(a.draft.label)).map((a) => ({ id: a.id, kind: "added" as const, draft: a.draft })),
  ];

  const creates = cards.filter((c) => (c.kind === "preset" && c.picked) || c.kind === "added").map((c) => c.draft);
  const updates = Object.entries(fieldEdits)
    .map(([id, d]) => ({ field: byId.get(id), draft: d }))
    .filter((u): u is { field: CustomFieldDTO; draft: ColumnDraft } => !!u.field);

  const editingCard = editing && editing !== "new" ? cards.find((c) => c.id === editing) ?? null : null;
  const takenLabels = cards.filter((c) => c.id !== editing).map((c) => c.draft.label);

  const togglePreset = (label: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  const save = (d: ColumnDraft) => {
    const id = editing;
    setEditing(null);
    if (!id) return;
    if (id === "new") return setAdded((list) => [...list, { id: `a:${Date.now()}`, draft: d }]);
    if (id.startsWith("p:")) {
      const label = id.slice(2);
      setPresetDrafts((m) => ({ ...m, [label]: d }));
      setPicked((s) => new Set(s).add(label));
      return;
    }
    if (id.startsWith("a:")) return setAdded((list) => list.map((a) => (a.id === id ? { ...a, draft: d } : a)));
    const field = byId.get(id.slice(2));
    if (!field) return;
    const unchanged = Object.keys(patchFromDraft(field, d, { alerts: true, scoped: false })).length === 0;
    setFieldEdits((m) => {
      const next = { ...m };
      if (unchanged) delete next[field.id];
      else next[field.id] = d;
      return next;
    });
  };

  const remove = (id: string) => setAdded((list) => list.filter((a) => a.id !== id));

  /** Saves the plan. Plain columns go in one batch; ones with rules or required one by one. */
  const apply = async (companyId: string) => {
    const plain = creates.filter((d) => !hasAdvanced(d) && !d.is_required);
    const rich = creates.filter((d) => !plain.includes(d));
    if (plain.length) {
      await customFieldsApi.ensure(
        companyId,
        "product",
        plain.map((d) => ({ label: d.label.trim(), field_type: d.field_type, options: d.field_type === "select" ? parseOptions(d.options) : [] })),
      );
    }
    for (const d of rich) {
      await customFieldsApi.create(companyId, {
        entity: "product",
        label: d.label.trim(),
        field_type: d.field_type,
        options: d.field_type === "select" ? parseOptions(d.options) : [],
        is_required: d.is_required,
        rules: toRules(d, true),
      });
    }
    for (const { field, draft } of updates) {
      const patch = patchFromDraft(field, draft, { alerts: true, scoped: false });
      if (Object.keys(patch).length) await customFieldsApi.update(companyId, field.id, patch);
      setFieldEdits((m) => {
        const next = { ...m };
        delete next[field.id];
        return next;
      });
    }
  };

  return {
    cards,
    pending: creates.length + updates.length,
    editing,
    editingCard,
    takenLabels,
    startEdit: (id: string | null) => setEditing(id),
    togglePreset,
    save,
    remove,
    apply,
  };
}

export type ColumnPlan = ReturnType<typeof useColumnPlan>;
