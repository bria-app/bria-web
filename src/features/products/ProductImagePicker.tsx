"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage } from "./image";

interface ProductImagePickerProps {
  value: string | null;
  onChange: (value: string | null) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

/** Square photo slot: pick or drop an image; it is compressed in the browser before saving. */
export function ProductImagePicker({ value, onChange, className, disabled }: ProductImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const run = async (next: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    try {
      await onChange(await next());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
    } finally {
      setBusy(false);
    }
  };

  const pick = (file: File | undefined) => {
    if (file) void run(() => compressImage(file));
  };

  const locked = disabled || busy;

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        disabled={locked}
        aria-label={value ? "Cambiar la foto del producto" : "Agregar una foto del producto"}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!locked) pick(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative block aspect-square w-full overflow-hidden rounded-2xl border transition-colors disabled:cursor-not-allowed",
          value ? "border-border bg-surface" : "border-dashed border-border bg-surface-soft hover:border-text-muted/60",
          dragOver && "border-accent-text bg-primary-soft",
        )}
      >
        {value ? (
          <Image src={value} alt="" fill unoptimized sizes="200px" className="object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
            <ImagePlus aria-hidden className="h-6 w-6 text-text-muted" />
            <span className="text-[13px] font-semibold text-text-primary">Agregar foto</span>
            <span className="text-[11px] leading-tight text-text-muted">JPG, PNG o WEBP. La achicamos por ti.</span>
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-surface/80">
            <Loader2 aria-hidden className="h-6 w-6 animate-spin text-text-secondary" />
            <span className="sr-only">Procesando la foto</span>
          </span>
        )}
      </button>
      {value && (
        <div className="flex gap-3 text-[13px] font-semibold">
          <button type="button" disabled={locked} onClick={() => inputRef.current?.click()} className="text-text-secondary hover:text-text-primary">
            Cambiar
          </button>
          <button type="button" disabled={locked} onClick={() => void run(async () => null)} className="text-danger hover:underline">
            Quitar
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
