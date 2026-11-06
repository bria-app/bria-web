"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useToast } from "@/components/ui/Toast";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useProfile } from "@/hooks/useProfile";
import { useRole } from "@/hooks/useRole";
import { ApiError } from "@/services/api/client";
import { posApi } from "@/services/api/pos";
import { TicketPanel } from "@/features/pos/TicketPanel";
import { TillProducts } from "@/features/pos/TillProducts";
import { useTill } from "@/features/pos/useTill";
import { exactMatch, useTillCatalog } from "@/features/pos/useTillCatalog";
import { ReceiptPreview } from "@/features/invoicing/ReceiptPreview";

// The camera scanner is downloaded only when the cashier first opens it.
const CameraScannerModal = dynamic(() => import("@/features/pos/CameraScannerModal").then((m) => m.CameraScannerModal), {
  ssr: false,
  loading: () => (
    <span role="status" className="sr-only">
      Abriendo la cámara…
    </span>
  ),
});

/** Caja: search or scan on the left, the sale being built on the right. */
export default function TillPage() {
  const companyId = useCompanyId();
  const { company } = useProfile();
  const { isSeller } = useRole();
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const till = useTill(companyId);
  const [cameraOpen, setCameraOpen] = useState(false);
  // Loaded on the first opening and kept mounted, so the dialog closes and returns focus normally.
  const [cameraLoaded, setCameraLoaded] = useState(false);
  const [salesDone, setSalesDone] = useState(0);
  const catalog = useTillCatalog(companyId, salesDone);
  const quantities = useMemo(() => new Map(till.lines.map((l) => [l.product.id, l.quantity])), [till.lines]);

  const addByCode = async (code: string) => {
    const local = exactMatch(catalog.products, code);
    if (local) return till.add(local);
    if (!companyId) return;
    try {
      const product = await posApi.lookup(companyId, code);
      // The lookup also finds inactive products; the checkout would reject them.
      if (!product.is_active) return toast(`«${product.name}» está desactivado. Actívalo en Inventario para venderlo.`);
      till.add(product);
    } catch (err) {
      toast(
        err instanceof ApiError && err.status !== 404
          ? err.message
          : `No encontramos un producto con el código «${code}».`,
      );
    }
  };
  // The product side and the camera keep one stable callback that always reaches the latest handler.
  const addByCodeRef = useRef(addByCode);
  useEffect(() => {
    addByCodeRef.current = addByCode;
  });
  const onCode = useCallback((code: string) => addByCodeRef.current(code), []);
  const openCamera = useCallback(() => {
    setCameraLoaded(true);
    setCameraOpen(true);
  }, []);
  const closeCamera = useCallback(() => setCameraOpen(false), []);

  const onCameraDetected = useCallback(
    (code: string) => {
      setCameraOpen(false);
      void onCode(code).then(() => searchRef.current?.focus());
    },
    [onCode],
  );

  const { checkout, receipt } = till;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (receipt || cameraOpen) return;
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === "F9") {
        e.preventDefault();
        void checkout();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checkout, receipt, cameraOpen]);

  const newSale = () => {
    till.closeReceipt();
    setSalesDone((n) => n + 1);
    window.setTimeout(() => searchRef.current?.focus(), 30);
  };

  return (
    <div className="mx-auto max-w-[1600px]">
      <h1 className="sr-only">Caja</h1>
      {/* A workspace, not a document: «Hacia el lado» keeps it whole, a page wide. */}
      <div data-sw-keep="page" className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <TillProducts
          searchRef={searchRef}
          catalog={catalog}
          quantities={quantities}
          onAdd={till.add}
          onCode={onCode}
          onOpenCamera={openCamera}
          isSeller={isSeller}
        />
        <TicketPanel till={till} />
      </div>

      {cameraLoaded && <CameraScannerModal open={cameraOpen} onClose={closeCamera} onDetected={onCameraDetected} />}
      <ReceiptPreview order={receipt} company={company} open={!!receipt} onClose={newSale} onNewSale={newSale} />
    </div>
  );
}
