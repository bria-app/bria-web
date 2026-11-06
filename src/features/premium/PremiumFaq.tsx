import { ChevronDown } from "lucide-react";

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Qué cambia exactamente con Premium?",
    a: "El número de predicciones con IA que puedes lanzar al mes: el plan Gratis tiene un tope y Premium no. Cada predicción puede cubrir todos tus productos o el grupo que elijas, en los dos planes.",
  },
  {
    q: "¿Cuándo vuelve a empezar el límite del plan Gratis?",
    a: "El primer día de cada mes. Las predicciones que fallan o cancelas no cuentan.",
  },
  {
    q: "¿Mensual o anual?",
    a: "Es el mismo plan. El mensual no tiene permanencia; el anual se paga una vez y sale más barato por mes.",
  },
  {
    q: "Si dejo Premium, ¿pierdo algo?",
    a: "No. Tus ventas, tu inventario y las predicciones que ya lanzaste se quedan. Solo vuelve el tope mensual.",
  },
  {
    q: "¿Se cobra de verdad?",
    a: "No. En esta versión de bria el pago es una demostración: se registra con una referencia, pero no se carga nada a tu tarjeta, Yape ni cuenta.",
  },
];

/** Questions people ask before paying, answered with what the system really does. */
export function PremiumFaq() {
  return (
    <section aria-labelledby="faq-title" className="flex flex-col gap-3">
      <h2 id="faq-title" className="font-display text-lg font-bold text-text-primary">Preguntas frecuentes</h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {FAQ.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sm font-semibold text-text-primary hover:bg-surface-soft [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-4 text-sm leading-relaxed text-text-secondary">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
