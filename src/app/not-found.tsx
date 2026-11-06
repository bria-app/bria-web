import Link from "next/link";
import { MapPinOff } from "lucide-react";

/** Unknown address: same shape as the app's empty states, with the way back. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-2 py-24 text-center">
      <div aria-hidden className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-accent-text">
        <MapPinOff className="h-6 w-6" />
      </div>
      <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-text-primary">Esta página no existe</h1>
      <p className="text-pretty text-[15px] leading-relaxed text-text-secondary">
        Puede que el enlace esté mal escrito o que la página se haya movido. Desde el inicio llegas a todo.
      </p>
      <Link href="/" className="btn btn-primary mt-2 h-11 px-5 text-sm">Volver al inicio</Link>
    </div>
  );
}
