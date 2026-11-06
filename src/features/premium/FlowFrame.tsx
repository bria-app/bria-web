import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

interface FlowFrameProps {
  /** Where «volver» goes; omitted on the last step. */
  back?: { href: string; label: string };
  children: React.ReactNode;
}

/** Full-screen frame for checkout and its confirmation (they live outside the app shell). */
export function FlowFrame({ back, children }: FlowFrameProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between gap-4 px-4 sm:px-6">
          <Wordmark className="text-[22px]" />
          {back && (
            <Link href={back.href} className="btn btn-ghost h-10 gap-1.5 px-3 text-sm">
              <ArrowLeft aria-hidden className="h-4 w-4" /> {back.label}
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1080px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
