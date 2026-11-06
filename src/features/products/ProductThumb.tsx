import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  xs: { box: "h-8 w-8 rounded-lg", px: 32, text: "text-xs" },
  sm: { box: "h-10 w-10 rounded-xl", px: 40, text: "text-sm" },
  md: { box: "h-14 w-14 rounded-2xl", px: 56, text: "text-lg" },
  lg: { box: "h-16 w-16 rounded-2xl", px: 64, text: "text-xl" },
} as const;

/**
 * Product photo, or a neutral tile with the product's initial.
 * Photos are data URLs or arbitrary shop URLs, so Next's optimizer is skipped.
 */
export function ProductThumb({
  src,
  name,
  size = "sm",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={s.px}
        height={s.px}
        unoptimized
        className={cn("shrink-0 border border-border bg-surface object-cover", s.box, className)}
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center border border-border bg-surface-soft text-text-muted", s.box, className)}
    >
      {initial ? <span className={cn("font-display font-bold", s.text)}>{initial}</span> : <Package className="h-4 w-4" />}
    </span>
  );
}
