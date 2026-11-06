"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

const FORMATS = ["qr_code", "ean_13", "ean_8", "code_128", "upc_a"];

const detectorCtor = () => (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;

/** Reads a barcode or QR with the device camera using the browser's BarcodeDetector. */
export function CameraScannerModal({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Escanear con la cámara"
      description="Apunta al código de barras o QR del producto."
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {open && <CameraView onDetected={onDetected} />}
    </Modal>
  );
}

/** Mounted only while the modal is open, so every opening starts the camera fresh. */
function CameraView({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported] = useState(() => !!detectorCtor() && !!navigator.mediaDevices?.getUserMedia);
  const [status, setStatus] = useState<"starting" | "scanning" | "denied">("starting");

  useEffect(() => {
    const Detector = detectorCtor();
    if (!supported || !Detector) return;
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer = 0;
    const detector = new Detector({ formats: FORMATS });

    const tick = async () => {
      const video = videoRef.current;
      if (stopped || !video) return;
      try {
        if (video.readyState >= 2) {
          const value = (await detector.detect(video)).find((c) => c.rawValue)?.rawValue;
          if (value && !stopped) {
            stopped = true;
            onDetected(value);
            return;
          }
        }
      } catch {
        // The frame was not ready yet; try the next one.
      }
      timer = window.setTimeout(tick, 220);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play();
        }
        setStatus("scanning");
        void tick();
      })
      .catch(() => setStatus("denied"));

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [supported, onDetected]);

  if (!supported || status === "denied") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-warning-soft text-warning">
          <CameraOff aria-hidden className="h-6 w-6" />
        </div>
        <p className="font-display text-lg font-bold text-text-primary">
          {supported ? "No pudimos usar la cámara" : "Este navegador no lee códigos con la cámara"}
        </p>
        <p className="max-w-sm text-sm text-text-secondary">
          {supported
            ? "Revisa el permiso de cámara del navegador para este sitio y vuelve a intentarlo."
            : "Usa Chrome o Edge en Android. También puedes escribir el código en el buscador o usar un lector USB."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-muted">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative h-[42%] w-[72%] rounded-2xl border-2 border-primary shadow-[0_0_0_9999px_rgb(var(--shadow-color)/0.35)]">
          <span className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary" />
        </div>
      </div>
      {status === "starting" && (
        <div className="absolute inset-0 grid place-items-center bg-surface/70 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-2">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Iniciando cámara…
          </span>
        </div>
      )}
    </div>
  );
}
