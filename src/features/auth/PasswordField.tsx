"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { TextField } from "@/components/ui/TextField";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string | null;
  hint?: string;
  autoFocus?: boolean;
}

/** Password input with show/hide and a Caps Lock warning (the most common cause of failed logins). */
export function PasswordField({ label, value, onChange, autoComplete, error, hint, autoFocus }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const detectCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState("CapsLock"));

  return (
    <TextField
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={detectCaps}
      onKeyUp={detectCaps}
      onBlur={() => setCapsLock(false)}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      required
      error={error}
      hint={capsLock ? "Bloq Mayús está activado." : hint}
      prefix={<Lock aria-hidden className="h-[18px] w-[18px]" />}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="grid h-9 w-9 place-items-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
        >
          {visible ? <EyeOff aria-hidden className="h-[18px] w-[18px]" /> : <Eye aria-hidden className="h-[18px] w-[18px]" />}
        </button>
      }
    />
  );
}
