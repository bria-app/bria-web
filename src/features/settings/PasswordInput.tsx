"use client";

import { useId, useState } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { generatePassword } from "./credentials";
import { inputClass } from "@/lib/ui";
import { MIN_PASSWORD } from "./roles";

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  onBlur?: () => void;
}

/** Password for someone else: visible by default, with «generar» and «copiar». */
export function PasswordInput({ label, value, onChange, error, onBlur }: PasswordInputProps) {
  const id = useId();
  const toast = useToast();
  const [show, setShow] = useState(true);

  const copy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast("Contraseña copiada"))
      .catch(() => toast("Tu navegador no dejó copiar. Selecciónala y cópiala a mano."));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-text-secondary">{label}</label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            autoComplete="new-password"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-msg`}
            className={inputClass(!!error, "h-12 pr-11 font-mono")}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-text-muted hover:text-text-primary"
          >
            {show ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
          </button>
        </div>
        <button type="button" onClick={() => onChange(generatePassword())} aria-label="Generar otra contraseña" title="Generar otra" className="btn btn-secondary h-12 w-12 shrink-0 p-0">
          <RefreshCw aria-hidden className="h-4 w-4" />
        </button>
        <button type="button" onClick={copy} disabled={!value} aria-label="Copiar contraseña" title="Copiar" className="btn btn-secondary h-12 w-12 shrink-0 p-0 disabled:opacity-50">
          <Copy aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <p id={`${id}-msg`} className={error ? "text-[12.5px] text-danger" : "text-[12.5px] text-text-muted"}>
        {error ?? `Mínimo ${MIN_PASSWORD} caracteres. Usa «generar» para una segura.`}
      </p>
    </div>
  );
}
