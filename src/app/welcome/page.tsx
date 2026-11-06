"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileSpreadsheet, PackagePlus, Receipt } from "lucide-react";
import { DataState } from "@/components/ui/DataState";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BusinessStep } from "@/features/onboarding/BusinessStep";
import { DoneStep, type DoneRow } from "@/features/onboarding/DoneStep";
import { IntroStep } from "@/features/onboarding/IntroStep";
import { LookStep } from "@/features/onboarding/LookStep";
import { LoadStep } from "@/features/onboarding/LoadStep";
import { SetupStep } from "@/features/onboarding/SetupStep";
import { StorePreview } from "@/features/onboarding/StorePreview";
import { StoreStep, type StoreDraft } from "@/features/onboarding/StoreStep";
import { TeamStep } from "@/features/onboarding/TeamStep";
import { WelcomeHeader } from "@/features/onboarding/WelcomeHeader";
import { STEPS, useWelcome } from "@/features/onboarding/useWelcome";

// The dialogs (Excel parsing included) load only when the person opens one.
const ProductImportWizard = dynamic(() => import("@/features/inventory/ProductImportWizard").then((m) => m.ProductImportWizard), { ssr: false });
const ProductFormModal = dynamic(() => import("@/features/products/ProductFormModal").then((m) => m.ProductFormModal), { ssr: false });
const SalesImportWizard = dynamic(() => import("@/features/sales/SalesImportWizard").then((m) => m.SalesImportWizard), { ssr: false });

type Dialog = "import" | "product" | "sales";

/** First run after sign-up: a guided setup with a live preview of the shop beside it. */
export default function WelcomePage() {
  const w = useWelcome();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  // Once opened, a dialog stays mounted, so closing and reopening it is instant.
  const [opened, setOpened] = useState<ReadonlySet<Dialog>>(() => new Set());
  const openDialog = (d: Dialog) => {
    setDialog(d);
    setOpened((prev) => (prev.has(d) ? prev : new Set(prev).add(d)));
  };
  const closeDialog = () => setDialog(null);
  const [draft, setDraft] = useState<StoreDraft | null>(null);

  if (w.loading || !w.company) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="w-full max-w-md">
          <DataState loading={!w.error} error={w.error} onRetry={w.reload.company}>
            {null}
          </DataState>
        </div>
      </div>
    );
  }

  const company = w.company;
  const store = w.step === "store" && draft ? draft : company;
  const productFields = w.fields.map((f) => f.label);

  const rows: DoneRow[] = [
    { label: "Rubro", value: w.businessLabel ?? "Sin elegir", ok: !!w.businessLabel, step: 1 },
    { label: "Datos de tus comprobantes", value: [company.address, company.phone].filter(Boolean).join(" · ") || "Sin dirección ni teléfono", ok: !!(company.address || company.phone), step: 2 },
    {
      label: "Tipos de producto y columnas",
      value: w.categories.length || w.fields.length ? `${plural(w.categories.length, "tipo", "tipos")} · ${plural(w.fields.length, "columna", "columnas")}` : "Sin ajustar",
      ok: w.categories.length + w.fields.length > 0,
      step: 3,
    },
    { label: "Productos", value: w.productCount ? plural(w.productCount, "producto cargado", "productos cargados") : "Todavía ninguno", ok: !!w.productCount, step: 4 },
    { label: "Ventas pasadas", value: w.hasSales ? "Cargadas: bria ya puede pronosticar" : "Sin cargar: el pronóstico usará las ventas de la caja", ok: !!w.hasSales, step: 5 },
    { label: "Equipo", value: w.team.length ? plural(w.team.length, "persona más", "personas más") : "Trabajas solo por ahora", ok: w.team.length > 0, step: 6 },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-text-primary">
      <WelcomeHeader
        steps={STEPS.slice(1).map((s) => s.label)}
        current={w.index}
        onJump={w.goTo}
        onLeave={w.leave}
        leaving={w.leaving}
      />

      {/* The space under the header. A step shorter than it sits centered (auto margins); a taller
          one starts at the top and the page scrolls, so nothing is ever clipped. */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        {/* «A tu gusto» brings its own live preview, so it takes the full width. */}
        <div
          className={cn(
            "my-auto grid w-full gap-12 xl:gap-16",
            w.step !== "look" && "lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]",
          )}
        >
          <main key={w.step} className={cn("page-enter min-w-0", w.step !== "look" && "max-w-3xl lg:self-center")}>
            {w.step === "intro" && <IntroStep firstName={w.firstName} companyName={company.name} onStart={w.next} />}
            {w.step === "business" && (
              <BusinessStep companyId={w.companyId} current={w.businessLabel} onSaved={w.reload.company} onBack={w.back} onNext={w.next} />
            )}
            {w.step === "store" && (
              <StoreStep companyId={w.companyId} company={company} onDraft={setDraft} onSaved={w.reload.company} onBack={w.back} onNext={w.next} />
            )}
            {w.step === "setup" && (
              <SetupStep
                companyId={w.companyId}
                business={w.business}
                categories={w.categories}
                fields={w.fields}
                onSaved={w.reload.setup}
                onBack={w.back}
                onNext={w.next}
              />
            )}
            {w.step === "products" && (
              <LoadStep
                kicker="Paso 4 · Productos"
                title="Carga tus productos"
                text="Sube tu Excel tal como lo tienes: con nombre y precio basta, y cuánto tienes de cada uno si lo llevas. También puedes crearlos uno por uno."
                done={w.productCount ? `Ya tienes ${plural(w.productCount, "producto cargado", "productos cargados")}.` : null}
                options={[
                  { icon: FileSpreadsheet, title: "Subir mi Excel o CSV", text: "Reconocemos tus columnas y ves cada fila antes de guardar.", tag: "Lo más rápido", onClick: () => openDialog("import") },
                  { icon: PackagePlus, title: "Crear un producto a mano", text: "Nombre, precio, inventario y foto.", onClick: () => openDialog("product") },
                ]}
                onBack={w.back}
                onNext={w.next}
              />
            )}
            {w.step === "sales" && (
              <LoadStep
                kicker="Paso 5 · Ventas pasadas"
                title="¿Llevabas tus ventas en Excel?"
                text="Súbelas y bria podrá pronosticar cuánto venderás desde hoy, sin esperar semanas. No cambian tu inventario: solo cuentan como historia."
                done={w.hasSales ? "Ya cargaste ventas pasadas." : null}
                options={[
                  { icon: Receipt, title: "Subir mi Excel de ventas", text: "Una fila por producto vendido, con fecha y cantidad. Mientras más meses, mejor.", onClick: () => openDialog("sales") },
                ]}
                tip={w.productCount === 0 ? "Consejo: carga primero tus productos, así cada venta encuentra el suyo." : null}
                onBack={w.back}
                onNext={w.next}
              />
            )}
            {w.step === "team" && <TeamStep companyId={w.companyId} team={w.team} onSaved={w.reload.team} onBack={w.back} onNext={w.next} />}
            {w.step === "look" && (
              <LookStep companyId={w.companyId} firstName={w.firstName} shopName={company.name} onBack={w.back} onNext={w.next} />
            )}
            {w.step === "done" && <DoneStep rows={rows} products={w.productCount} onJump={w.goTo} onFinish={w.finish} leaving={w.leaving} />}
          </main>

          <div className={cn("hidden", w.step !== "look" && "lg:block")}>
            <div className="sticky top-28">
              <StorePreview
                name={store.name}
                taxId={company.tax_id}
                address={store.address}
                phone={store.phone}
                business={w.business}
                businessLabel={w.businessLabel}
                categories={w.categories.map((c) => c.name)}
                fields={productFields}
                products={w.productCount}
                hasSales={w.hasSales}
                team={w.team.length}
              />
            </div>
          </div>
        </div>
      </div>

      {opened.has("import") && (
        <ProductImportWizard
          open={dialog === "import"}
          onClose={closeDialog}
          companyId={w.companyId}
          fields={w.fields}
          onFinished={() => {
            w.reload.products();
            w.reload.setup();
          }}
        />
      )}
      {opened.has("product") && (
        <ProductFormModal
          open={dialog === "product"}
          onClose={closeDialog}
          companyId={w.companyId}
          product={null}
          categories={w.categories}
          fields={w.fields}
          onFieldsChanged={w.reload.setup}
          onSaved={w.reload.products}
        />
      )}
      {opened.has("sales") && (
        <SalesImportWizard open={dialog === "sales"} onClose={closeDialog} companyId={w.companyId} onFinished={w.reload.sales} />
      )}
    </div>
  );
}
