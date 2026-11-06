"use client";

import { RefObject } from "react";
import { Camera, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TillSearchProps {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  /** Enter with text: add the exact code match or the first result. */
  onEnter: () => void;
  onOpenCamera: () => void;
}

/** The till's main input. Hardware scanners type the code and press Enter. */
export function TillSearch({ inputRef, value, onChange, onEnter, onOpenCamera }: TillSearchProps) {
  return (
    <div className="flex items-stretch gap-2">
      <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-primary bg-surface px-4 focus-within:ring-4 focus-within:ring-primary/20">
        <Search aria-hidden className="h-5 w-5 shrink-0 text-text-muted" />
        <span className="sr-only">Buscar producto</span>
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (value.trim()) onEnter();
          }}
          placeholder="Nombre, código (SKU) o de barras · Enter agrega el primero"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-text-primary outline-none placeholder:text-[15px] placeholder:text-text-muted"
        />
        <kbd className="hidden shrink-0 rounded-md border border-border bg-surface-soft px-1.5 py-0.5 font-mono text-[11px] text-text-muted sm:inline">
          F2
        </kbd>
      </label>
      <Button variant="secondary" size="lg" onClick={onOpenCamera} className="h-14 shrink-0 rounded-2xl px-4" aria-label="Escanear con la cámara">
        <Camera aria-hidden className="h-5 w-5" />
        <span className="hidden md:inline">Cámara</span>
      </Button>
    </div>
  );
}
