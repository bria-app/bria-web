"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";
import type { SalesDocumentType } from "@/types/pos";
import { ClientData, EMPTY_CLIENT, clientProblem, clientRequired } from "./client";

interface ClientSectionProps {
  doc: SalesDocumentType;
  client: ClientData;
  onClient: (client: ClientData) => void;
  onDoc: (doc: SalesDocumentType) => void;
  total: number;
}

const docLabel = (n: string) => (n.length === 11 ? `RUC ${n}` : `DNI ${n}`);

/**
 * Client data is free text on the sale (there is no customer list in the backend).
 * Collapsed it reads like a line of the comprobante; tap to fill DNI/RUC and name.
 */
export function ClientSection({ doc, client, onClient, onDoc, total }: ClientSectionProps) {
  const [editing, setEditing] = useState(false);
  const [tried, setTried] = useState(false);
  const number = client.docNumber.trim();
  const problem = clientProblem(doc, client, total);
  const required = clientRequired(doc, total);
  const set = (patch: Partial<ClientData>) => onClient({ ...client, ...patch });

  if (!editing) {
    const empty = !number && !client.name.trim();
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "flex min-h-14 w-full items-center gap-3 rounded-xl border bg-surface-soft px-3.5 py-2.5 text-left transition-colors hover:border-text-muted/50",
          problem && required ? "border-warning" : "border-border",
        )}
      >
        <UserRound aria-hidden className="h-[18px] w-[18px] shrink-0 text-text-muted" />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[14px] font-semibold text-text-primary">
            {client.name.trim() || (empty ? "Público en general" : "Sin nombre")}
          </span>
          <span className={cn("truncate text-[12.5px]", number ? "font-mono text-text-secondary" : "text-text-muted")}>
            {number ? docLabel(number) : doc === "factura" ? "Toca para poner el RUC" : "Toca para poner DNI o RUC"}
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-accent-text">Cambiar</span>
      </button>
    );
  }

  const confirm = () => {
    setTried(true);
    if (!problem) setEditing(false);
  };
  const rucOnBoleta = doc === "boleta" && number.length === 11;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-soft p-3">
      <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
        <TextField
          label={doc === "factura" ? "RUC" : "DNI o RUC"}
          value={client.docNumber}
          onChange={(e) => set({ docNumber: e.target.value.replace(/\D/g, "").slice(0, 11) })}
          inputMode="numeric"
          autoFocus
          className="[&_input]:font-mono"
        />
        <TextField
          label={doc === "factura" ? "Razón social" : "Nombre"}
          value={client.name}
          onChange={(e) => set({ name: e.target.value })}
          hint={required ? undefined : "Opcional"}
          onKeyDown={(e) => e.key === "Enter" && confirm()}
        />
      </div>
      {doc === "factura" && (
        <TextField label="Dirección fiscal" hint="Opcional" value={client.address} onChange={(e) => set({ address: e.target.value })} />
      )}
      {rucOnBoleta ? (
        <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-text-secondary">
          Es un RUC: corresponde factura.
          <Button variant="secondary" onClick={() => onDoc("factura")}>
            Cambiar a factura
          </Button>
        </p>
      ) : (
        tried &&
        problem && (
          <p role="alert" className="text-[12.5px] text-danger">
            {problem}
          </p>
        )
      )}
      <div className="flex justify-end gap-2">
        {doc !== "factura" && (
          <Button
            variant="ghost"
            onClick={() => {
              onClient(EMPTY_CLIENT);
              setTried(false);
              setEditing(false);
            }}
          >
            Público en general
          </Button>
        )}
        <Button variant="strong" onClick={confirm}>
          Usar estos datos
        </Button>
      </div>
    </div>
  );
}
