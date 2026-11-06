import type { ReactNode, SVGProps } from "react";

/**
 * bria.'s own line icons: what Peruvian MYPEs sell (Gamarra, la bodega, la ferretería…).
 * 48×48 grid, 2.25 stroke, round joins; `currentColor` for the line and an `accent` class for
 * the one filled detail, so they work on light, dark and ink surfaces. Pure SVG, no assets.
 */
export type ShopIconName =
  | "polo"
  | "zapatilla"
  | "martillo"
  | "gaseosa"
  | "pan"
  | "pastillas"
  | "celular"
  | "perfume"
  | "pata"
  | "lapiz"
  | "balanza"
  | "caja"
  | "boleta"
  | "bolsa"
  | "pintura"
  | "manzana";

const D: Record<ShopIconName, { line: ReactNode; accent?: ReactNode }> = {
  polo: {
    line: <path d="M18 8 9 13l4 8 4-2v21h14V19l4 2 4-8-9-5c-1 3.2-3.4 5-6 5s-5-1.8-6-5Z" />,
    accent: <path d="M21 26h6" />,
  },
  zapatilla: {
    line: (
      <>
        <path d="M6 32v-6c0-2 1.4-3.4 3.4-3.6L17 21l4-7 6 2.5-2 4.5c6 1.4 11.5 3.6 15.2 5.6 1.8 1 2.8 2.6 2.8 4.4v1H6Z" />
        <path d="M6 32v3h37v-3" />
      </>
    ),
    accent: <path d="M21 22l2.5 1.2M19 25.5l2.5 1.2" />,
  },
  martillo: {
    line: (
      <>
        <path d="M14 10h17l5 3v5H14z" />
        <path d="M23 18v20a2.5 2.5 0 0 0 5 0V18" />
      </>
    ),
    accent: <path d="M23 31h5" />,
  },
  gaseosa: {
    line: <path d="M21 6h6v5c3 2 4.5 5 4.5 8.5V40a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V19.5c0-3.5 1.5-6.5 4.5-8.5Z" />,
    accent: <path d="M16.5 24h15v8h-15z" />,
  },
  pan: {
    line: <path d="M8 26c0-6.5 7.2-11 16-11s16 4.5 16 11v9a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2Z" />,
    accent: <path d="M17 21l3 4M23 20l3 4M29 21l3 4" />,
  },
  pastillas: {
    line: (
      <>
        <rect x="7" y="17" width="26" height="12" rx="6" transform="rotate(-35 20 23)" />
        <circle cx="34" cy="33" r="7" />
      </>
    ),
    accent: <path d="M16.5 16.5l7 9.7M29.5 33h9" />,
  },
  celular: {
    line: <rect x="14" y="5" width="20" height="38" rx="4" />,
    accent: <path d="M21 9h6M22 37h4" />,
  },
  perfume: {
    line: (
      <>
        <path d="M20 8h8v6h-8z" />
        <rect x="11" y="14" width="26" height="28" rx="6" />
      </>
    ),
    accent: <circle cx="24" cy="28" r="5" />,
  },
  pata: {
    line: (
      <>
        <path d="M24 26c-5.5 0-10 4.6-10 9 0 2.6 2 4 4.5 4 2 0 3.5-1 5.5-1s3.5 1 5.5 1c2.5 0 4.5-1.4 4.5-4 0-4.4-4.5-9-10-9Z" />
        <circle cx="12" cy="21" r="3.5" />
        <circle cx="36" cy="21" r="3.5" />
      </>
    ),
    accent: (
      <>
        <circle cx="19" cy="13" r="3.5" />
        <circle cx="29" cy="13" r="3.5" />
      </>
    ),
  },
  lapiz: {
    line: <path d="M31 7l10 10L18 40l-11 2 2-11Z" />,
    accent: <path d="M27 11l10 10" />,
  },
  balanza: {
    line: (
      <>
        <path d="M24 8v32M14 40h20M10 14h28" />
        <path d="M10 14 5 26a5 5 0 0 0 10 0Z" />
        <path d="M38 14l-5 12a5 5 0 0 0 10 0Z" />
      </>
    ),
    accent: <circle cx="24" cy="8" r="2.5" />,
  },
  caja: {
    line: (
      <>
        <path d="M24 6 41 14v20L24 42 7 34V14Z" />
        <path d="M7 14l17 8 17-8M24 22v20" />
      </>
    ),
    accent: <path d="M15.5 10 32.5 18" />,
  },
  boleta: {
    line: <path d="M12 6h24v36l-4-3-4 3-4-3-4 3-4-3-4 3Z" />,
    accent: <path d="M17 14h14M17 20h14M17 26h8" />,
  },
  bolsa: {
    line: (
      <>
        <path d="M10 16h28l-2 26H12Z" />
        <path d="M18 20v-6a6 6 0 0 1 12 0v6" />
      </>
    ),
    accent: <path d="M17 30h14" />,
  },
  pintura: {
    line: (
      <>
        <path d="M9 14h30v24a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4Z" />
        <path d="M14 14c0-5 4.5-8 10-8s10 3 10 8" />
      </>
    ),
    accent: <path d="M9 22c5 0 5 6 10 6s5-6 10-6 5 4 10 4" />,
  },
  manzana: {
    line: <path d="M24 16c-3-3-12-3-13 6-1 7 3.5 18 8.5 18 2 0 3-1 4.5-1s2.5 1 4.5 1c5 0 9.5-11 8.5-18-1-9-10-9-13-6Z" />,
    accent: <path d="M24 16c0-4 2-7 6-8" />,
  },
};

export const SHOP_ICONS = Object.keys(D) as ShopIconName[];

interface ShopIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: ShopIconName;
  /** Class for the accent detail (defaults to the brand amber). */
  accentClassName?: string;
}

export function ShopIcon({ name, accentClassName = "stroke-brand", className, ...props }: ShopIconProps) {
  const icon = D[name];
  // An unknown name draws nothing rather than taking the whole screen down.
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      {icon.line}
      {icon.accent && <g className={accentClassName}>{icon.accent}</g>}
    </svg>
  );
}
