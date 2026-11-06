import { Button } from "./Button";

interface SaveBarProps {
  /** What is pending or what to fix, e.g. «2 cambios sin guardar». */
  message: string;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/** Sticky ink bar shown while a record has unsaved edits. Stays above the bottom dock (`--dock-clear`, set by AppShell). */
export function SaveBar({ message, saving, onSave, onDiscard }: SaveBarProps) {
  return (
    <div role="status" className="sticky bottom-[calc(var(--dock-clear,0px)+1.25rem)] z-20 flex flex-wrap items-center gap-3 rounded-2xl bg-strong px-4 py-3 text-strong-foreground shadow-soft-xl">
      <span className="min-w-0 flex-1 basis-[200px] text-sm font-semibold">{message}</span>
      <button
        type="button"
        onClick={onDiscard}
        disabled={saving}
        className="h-10 shrink-0 rounded-xl border border-strong-foreground/60 px-4 text-sm font-semibold transition-opacity hover:opacity-80 focus-visible:outline-accent-on-strong disabled:opacity-50"
      >
        Descartar
      </button>
      <Button onClick={onSave} loading={saving} className="h-10 shrink-0">
        Guardar cambios
      </Button>
    </div>
  );
}
