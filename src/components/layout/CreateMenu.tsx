"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useRole } from "@/hooks/useRole";
import { OWNER_CREATE, SELLER_CREATE, type CreateAction } from "./createActions";

interface CreateMenuProps {
  open: boolean;
  onClose: () => void;
}

/** «Crear»: one place to start anything. Letter shortcuts work while it is open. */
export function CreateMenu({ open, onClose }: CreateMenuProps) {
  const router = useRouter();
  const { isSeller } = useRole();
  const actions = isSeller ? SELLER_CREATE : OWNER_CREATE;

  const start = useCallback(
    (action: CreateAction) => {
      onClose();
      router.push(action.href);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).tagName === "INPUT") return;
      const action = actions.find((a) => a.key === e.key.toLowerCase());
      if (action) {
        e.preventDefault();
        start(action);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, actions, start]);

  return (
    <Modal open={open} onClose={onClose} title="¿Qué quieres crear?" size="lg">
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.href}>
              <button
                type="button"
                onClick={() => start(action)}
                className="flex h-full w-full flex-col gap-2 rounded-2xl border border-border bg-surface-soft p-4 text-left transition-colors hover:border-accent-line hover:bg-primary-softer"
              >
                <span className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface text-accent-text">
                    <Icon aria-hidden className="h-[18px] w-[18px]" />
                  </span>
                  <kbd className="font-mono text-[11px] uppercase text-text-muted">{action.key}</kbd>
                </span>
                <span className="font-semibold">{action.label}</span>
                <span className="text-[13px] text-text-secondary">{action.hint}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
