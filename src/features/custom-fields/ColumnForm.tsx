"use client";

import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types/api";
import { ColumnEditor } from "./ColumnEditor";
import type { ColumnDraft } from "./columnDraft";
import { validateDraft } from "./draftChecks";
import type { StorableEntity } from "./entities";

interface ColumnFormProps {
  title?: string;
  /** Read once: give the form a new `key` to start over. */
  initial: ColumnDraft;
  entity: StorableEntity;
  /** Names already used by other columns (a duplicate is stopped before asking the API). */
  takenLabels: string[];
  categories?: CategoryDTO[] | null;
  onCreateCategory?: (name: string) => Promise<CategoryDTO | null>;
  typeLocked?: boolean;
  submitLabel: string;
  busy?: boolean;
  /** The API's answer when saving failed. */
  error?: string | null;
  /** Resolves false when saving failed, so the draft stays. */
  onSubmit: (draft: ColumnDraft) => unknown;
  onCancel?: () => void;
  /** Inside another form a nested <form> is invalid HTML: render a <div> and catch Enter. */
  nested?: boolean;
  autoFocus?: boolean;
  extra?: ReactNode;
  /** Small print beside the buttons. */
  note?: ReactNode;
  className?: string;
}

/** The column editor with its title, checks and Save / Cancel. */
export function ColumnForm(props: ColumnFormProps) {
  const { title, initial, entity, takenLabels, categories, onCreateCategory, typeLocked, submitLabel, busy, error, onSubmit, onCancel, nested, autoFocus, extra, note, className } =
    props;
  const [draft, setDraft] = useState(initial);
  const [tried, setTried] = useState(false);
  const errors = validateDraft(draft, { takenLabels, withScope: !!categories, alertsAllowed: entity === "product" });
  const count = Object.keys(errors).length;

  const submit = () => {
    setTried(true);
    if (count > 0) return;
    void onSubmit(draft);
  };

  const body = (
    <>
      {title && <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>}
      <ColumnEditor
        draft={draft}
        onChange={setDraft}
        errors={tried ? errors : {}}
        entity={entity}
        typeLocked={typeLocked}
        categories={categories}
        onCreateCategory={onCreateCategory}
        autoFocus={autoFocus}
        extra={extra}
      />
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {tried && count > 0 && (
        <p role="alert" className="text-[13px] text-warning">
          Revisa {count === 1 ? "el dato marcado" : `los ${count} datos marcados`}.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-[200px] text-[12.5px] text-text-muted">{note}</div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
              Cancelar
            </Button>
          )}
          <Button variant="strong" size="sm" type={nested ? "button" : "submit"} onClick={nested ? submit : undefined} loading={busy}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </>
  );

  const shell = cn("space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5", className);
  if (nested) {
    return (
      <div
        className={shell}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.defaultPrevented && (e.target as HTMLElement).tagName === "INPUT") {
            e.preventDefault();
            submit();
          }
        }}
      >
        {body}
      </div>
    );
  }
  return (
    <form
      noValidate
      className={shell}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {body}
    </form>
  );
}
