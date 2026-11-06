"use client";

import { useId, useState } from "react";
import { Check, Plus } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { flattenTree } from "@/features/products/categoryTree";
import type { CategoryDTO } from "@/types/api";

type Mode = "all" | "some";

interface ScopePickerProps {
  categories: CategoryDTO[];
  /** Selected category ids. [] = every product. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Controlled mode, so «some» can be shown before any category is picked. */
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
  /** Lets the user add a category right here. Resolves with the new category. */
  onCreateCategory?: (name: string) => Promise<CategoryDTO | null>;
}

/** «¿Para qué productos?»: every product, or only some categories (subcategories included). */
export function ScopePicker({ categories, value, onChange, mode: modeProp, onModeChange, onCreateCategory }: ScopePickerProps) {
  const ids = useId();
  const [innerMode, setInnerMode] = useState<Mode>(value.length ? "some" : "all");
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const mode = modeProp ?? innerMode;
  const tree = flattenTree(categories);

  const setMode = (m: Mode) => {
    setInnerMode(m);
    onModeChange?.(m);
    if (m === "all") onChange([]);
  };
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const create = async () => {
    const name = draft.trim();
    if (!name || !onCreateCategory) return;
    setCreating(true);
    try {
      const cat = await onCreateCategory(name);
      if (cat) onChange([...value, cat.id]);
      setDraft("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <Segmented<Mode>
        label="¿Para qué productos?"
        size="sm"
        value={mode}
        onChange={setMode}
        options={[
          { value: "all", label: "Todos los productos" },
          { value: "some", label: "Solo algunas categorías" },
        ]}
      />
      {mode === "some" && (
        <div className="space-y-2">
          {tree.length === 0 ? (
            <p className="text-[12.5px] text-text-muted">Aún no tienes categorías.{onCreateCategory ? " Crea la primera aquí abajo." : ""}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tree.map(({ category, depth }) => {
                const on = value.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(category.id)}
                    className={cn(
                      "inline-flex h-9 max-w-full items-center gap-1 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                      on ? "border-strong bg-strong text-strong-foreground" : "border-border bg-surface text-text-primary hover:border-text-muted/50",
                    )}
                  >
                    {on ? <Check aria-hidden className="h-3.5 w-3.5 shrink-0" /> : depth > 0 && <span aria-hidden className="text-text-muted">↳</span>}
                    <span className="truncate">{category.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {onCreateCategory && (
            <div className="flex items-center gap-2">
              <label htmlFor={`${ids}-new`} className="sr-only">
                Nueva categoría
              </label>
              <input
                id={`${ids}-new`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void create();
                  }
                }}
                placeholder="Nueva categoría (ej. Ropa)"
                className={inputClass(false, "h-9")}
              />
              <Button size="sm" variant="secondary" onClick={() => void create()} disabled={!draft.trim()} loading={creating}>
                <Plus aria-hidden className="h-3.5 w-3.5" /> Crear
              </Button>
            </div>
          )}
          {value.length === 0 && tree.length > 0 && <p className="text-[12.5px] text-warning">Elige al menos una categoría.</p>}
        </div>
      )}
    </div>
  );
}
