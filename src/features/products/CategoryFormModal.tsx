"use client";

import { useId, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Segmented } from "@/components/ui/Segmented";
import { TextField } from "@/components/ui/TextField";
import { plural } from "@/lib/format";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/api/client";
import { categoriesApi } from "@/services/api/resources";
import type { CategoryDTO } from "@/types/api";
import { FieldShell } from "./FormBits";
import { categoryOptions, categoryPath } from "./categoryTree";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  /** null = create. */
  category: CategoryDTO | null;
  /** Preselect this parent when creating (e.g. «Agregar subcategoría» on a row). */
  defaultParentId?: string | null;
  categories: CategoryDTO[];
  /** Receives a message for the toast. */
  onSaved: (message: string) => void;
}

type Level = "root" | "child";

/** Create, rename or delete one category. The parent can only be chosen when creating (API limit). */
export function CategoryFormModal({ open, onClose, companyId, category, defaultParentId, categories, onSaved }: Props) {
  const ids = useId();
  const isEdit = category !== null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [level, setLevel] = useState<Level>("root");
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [session, setSession] = useState<{ open: boolean; category: CategoryDTO | null }>({ open: false, category: null });
  if (session.open !== open || session.category !== category) {
    setSession({ open, category });
    if (open) {
      const parent = (isEdit ? category?.parent_id : defaultParentId) ?? "";
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
      setParentId(parent);
      setLevel(parent ? "child" : "root");
      setError(null);
      setNameError(null);
      setConfirmDelete(false);
    }
  }

  const parentOptions = useMemo(() => categoryOptions(categories, undefined, category?.id), [categories, category?.id]);
  const effectiveParent = level === "child" ? parentId : "";
  const preview = [...categoryPath(categories, effectiveParent || null), name.trim() || "…"].join(" › ");

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!companyId) return;
    if (!name.trim()) return setNameError("Escribe el nombre de la categoría.");
    if (!isEdit && level === "child" && !parentId) return setError("Elige dentro de qué categoría va.");
    setBusy("save");
    setError(null);
    try {
      if (category) {
        await categoriesApi.update(companyId, category.id, { name: name.trim(), description: description.trim() });
        onSaved(`Guardaste «${name.trim()}».`);
      } else {
        await categoriesApi.create(companyId, { name: name.trim(), description: description.trim(), parent_id: effectiveParent || null });
        onSaved(`Creaste la categoría «${name.trim()}».`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!companyId || !category) return;
    setBusy("delete");
    setError(null);
    try {
      await categoriesApi.remove(companyId, category.id);
      onSaved(`Eliminaste «${category.name}».`);
      onClose();
    } catch (err) {
      // 409: the API counted what is still inside (paused products included) and says what to move.
      setError(err instanceof ApiError && err.status === 409 ? inUseMessage(err) : err instanceof Error ? err.message : "No se pudo eliminar.");
      setConfirmDelete(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar categoría" : "Nueva categoría"}
      description={isEdit ? categoryPath(categories, category?.id).join(" › ") : "Puedes usar dos niveles, por ejemplo marca › tipo."}
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {isEdit && (
            <div className="mr-auto flex flex-wrap items-center gap-2 text-[13px]">
              {confirmDelete ? (
                <>
                  <span className="text-text-secondary">¿Eliminar?</span>
                  <Button size="sm" variant="danger" onClick={remove} loading={busy === "delete"} disabled={!!busy}>
                    Sí, eliminar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={!!busy}>
                    No
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => setConfirmDelete(true)}
                  disabled={!!busy}
                >
                  Eliminar
                </Button>
              )}
            </div>
          )}
          <Button variant="secondary" onClick={onClose} disabled={!!busy}>
            Cancelar
          </Button>
          <Button variant="strong" onClick={() => submit()} loading={busy === "save"} disabled={!!busy}>
            {isEdit ? "Guardar cambios" : "Crear categoría"}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        {!isEdit && (
          <Segmented<Level>
            label="Nivel"
            value={level}
            onChange={setLevel}
            options={[
              { value: "root", label: "Principal" },
              { value: "child", label: "Dentro de otra" },
            ]}
          />
        )}
        <TextField
          label="Nombre"
          value={name}
          error={nameError}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          placeholder={level === "root" ? "Ej. Pro Plan" : "Ej. Alimento seco"}
          autoFocus
        />
        {!isEdit && level === "child" && (
          <FieldShell label="Va dentro de" hint={`Quedará así: ${preview}`}>
            <Select aria-label="Va dentro de" value={parentId} options={parentOptions} onChange={setParentId} searchable placeholder="Elige la categoría" />
          </FieldShell>
        )}
        <FieldShell label="Descripción" htmlFor={`${ids}-d`} hint="Opcional.">
          <textarea
            id={`${ids}-d`}
            className={cn(inputClass(), "h-auto resize-y py-2.5")}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FieldShell>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

/** The API's own message; built from its counts only if the message came back empty. */
function inUseMessage(err: ApiError): string {
  if (err.message) return err.message;
  const d = (err.details ?? {}) as { subcategories?: number; products?: number };
  if (d.subcategories) return `Tiene ${plural(d.subcategories, "subcategoría", "subcategorías")}: muévelas antes de borrarla.`;
  if (d.products) return `Tiene ${plural(d.products, "producto", "productos")}: muévelos antes de borrarla.`;
  return "No se puede borrar: todavía tiene cosas dentro.";
}
