import { ArrowRight, Clock, PackageOpen, Palette, Receipt, Store, Tags, Users, Wand2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

const PLAN: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Store, title: "Tu rubro", text: "Para hablar el idioma de tu tienda" },
  { icon: Receipt, title: "Datos de tus comprobantes", text: "Dirección y teléfono en cada boleta" },
  { icon: Tags, title: "Tipos de producto y columnas", text: "Tallas, vencimientos, marcas: lo que uses" },
  { icon: PackageOpen, title: "Tus productos", text: "Desde tu Excel o uno por uno" },
  { icon: Wand2, title: "Tus ventas pasadas", text: "Para que bria pronostique desde el día uno" },
  { icon: Users, title: "Tu equipo", text: "Usuarios para quienes cobran en la caja" },
  { icon: Palette, title: "A tu gusto", text: "Tema, menú y tu pantalla de inicio" },
];

/** Greeting: what the next minutes are for, so nothing comes as a surprise. */
export function IntroStep({ firstName, companyName, onStart }: { firstName: string | null; companyName: string | null; onStart: () => void }) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-[38px] font-bold leading-[1.05] tracking-[-0.035em] text-text-primary sm:text-[48px]">
          Hola{firstName ? `, ${firstName}` : ""}.
          <span className="block text-text-secondary">Dejemos {companyName ?? "tu tienda"} lista para vender.</span>
        </h1>
        <p className="max-w-lg text-[16px] leading-relaxed text-text-secondary">
          Te hacemos unas preguntas cortas y preparamos bria a la medida de tu negocio. Puedes saltar cualquier paso y cambiarlo
          después.
        </p>
      </div>

      <ol className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {PLAN.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="pop-in flex gap-3" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-text-secondary">
              <Icon aria-hidden className="h-[18px] w-[18px]" />
            </span>
            <span className="flex flex-col">
              <span className="text-[14px] font-semibold text-text-primary">{title}</span>
              <span className="text-[13px] text-text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button size="lg" onClick={onStart}>
          Empezar <ArrowRight aria-hidden className="h-4 w-4" />
        </Button>
        <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
          <Clock aria-hidden className="h-3.5 w-3.5" /> Unos 5 minutos
        </span>
      </div>
    </div>
  );
}
