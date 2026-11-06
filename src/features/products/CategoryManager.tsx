"use client";

import { useMemo, useState } from "react";
import { FolderTree, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { InlineNotice, type Notice } from "@/components/ui/InlineNotice";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types/api";
import { CategoryFormModal } from "./CategoryFormModal";
import { descendantIds, flattenTree } from "./categoryTree";

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  categories: CategoryDTO[];
  /** category_id of every product, to count products per branch. */
  productCategoryIds: (string | null)[];
  onChanged: () => void;
}

type Editing = { category: CategoryDTO | null; parentId: string | null } | null;

/** «Categorías»: the whole tree with product counts; create, rename and delete. */
export function CategoryManager({ open, onClose, companyId, categories, productCategoryIds, onChanged }: CategoryManagerProps) {
  const [editing, setEditing] = useState<Editing>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const rows = useMemo(() => flattenTree(categories), [categories]);
  const countOf = useMemo(() => {
    const direct = new Map<string, number>();
    for (const id of productCategoryIds) if (id) direct.set(id, (direct.get(id) ?? 0) + 1);
    return (id: string) => [...descendantIds(categories, id)].reduce((sum, cid) => sum + (direct.get(cid) ?? 0), 0);
  }, [categories, productCategoryIds]);
  const uncategorized = productCategoryIds.filter((id) => !id).length;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="md"
        title="Categorías"
        description="Ordena tu inventario. Una categoría puede tener otras dentro (marca › tipo)."
        footer={
          <Button variant="strong" onClick={() => setEditing({ category: null, parentId: null })} disabled={!companyId}>
            <Plus aria-hidden className="h-4 w-4" /> Nueva categoría
          </Button>
        }
      >
        <div className="mb-4 empty:hidden">
          <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
        </div>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <FolderTree aria-hidden className="h-6 w-6 text-text-muted" />
            <p className="max-w-sm text-sm text-text-secondary">Aún no tienes categorías. Crea la primera para filtrar tu inventario y tener campos por tipo de producto.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {rows.map(({ category, depth }) => (
              <li key={category.id} className="flex min-h-[52px] items-center gap-3 px-4 py-2">
                <span className={cn("min-w-0 flex-1 truncate text-sm", depth === 0 ? "font-semibold text-text-primary" : "text-text-secondary")} style={{ paddingLeft: depth * 20 }}>
                  {depth > 0 && <span aria-hidden className="mr-1.5 text-text-muted">↳</span>}
                  {category.name}
                </span>
                <span className="shrink-0 font-mono text-[13px] text-text-muted">
                  {formatNumber(countOf(category.id))} <span className="sr-only">productos</span>
                </span>
                {depth === 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ category: null, parentId: category.id })} aria-label={`Agregar una categoría dentro de «${category.name}»`}>
                    <Plus aria-hidden className="h-3.5 w-3.5" /> Dentro
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setEditing({ category, parentId: category.parent_id })} aria-label={`Editar «${category.name}»`}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
        {uncategorized > 0 && (
          <p className="mt-3 text-[13px] text-text-muted">
            {formatNumber(uncategorized)} {uncategorized === 1 ? "producto no tiene" : "productos no tienen"} categoría. Asígnala desde la ficha de cada uno.
          </p>
        )}
      </Modal>
      <CategoryFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        companyId={companyId}
        category={editing?.category ?? null}
        defaultParentId={editing?.parentId ?? null}
        categories={categories}
        onSaved={(message) => {
          onChanged();
          setNotice({ message });
        }}
      />
    </>
  );
}
