"use client";

import { ReactNode, useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportUploadStepProps {
  reading: boolean;
  error: string | null;
  hint?: ReactNode;
  onFile: (file: File) => void;
}

const STEPS = [
  { t: "Lo leemos tal como está", d: "No importa el orden ni el nombre de tus columnas." },
  { t: "Revisas antes de guardar", d: "Ves cada fila, corriges celdas y quitas lo que no va." },
  { t: "Se carga lo que está bien", d: "Las filas con error se saltan y te decimos cuáles fueron." },
];

/** Step 1: drop or pick an Excel/CSV file. Nothing is saved until the last step. */
export function ImportUploadStep({ reading, error, hint, onFile }: ImportUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={reading}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragOver ? "border-accent-text bg-primary-soft" : "border-border bg-surface-soft hover:border-text-muted/60",
        )}
      >
        {reading ? <Loader2 aria-hidden className="h-7 w-7 animate-spin text-text-secondary" /> : <UploadCloud aria-hidden className="h-7 w-7 text-text-secondary" />}
        <span className="font-display text-lg font-bold text-text-primary">{reading ? "Leyendo tu archivo…" : "Arrastra tu Excel o CSV aquí"}</span>
        <span className="text-sm text-text-secondary">o haz clic para elegirlo (.xlsx, .xls, .csv)</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.xlsx,.xls,.xlsm,.ods"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <ol className="grid gap-2 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.t} className="rounded-2xl border border-border px-4 py-3">
            <span className="block text-[13px] font-semibold text-text-primary">
              {i + 1}. {s.t}
            </span>
            <span className="block text-[12.5px] text-text-secondary">{s.d}</span>
          </li>
        ))}
      </ol>
      {hint && <div className="rounded-2xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">{hint}</div>}
    </div>
  );
}
