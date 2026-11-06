import type { ReactNode, SVGProps } from "react";

/**
 * Line icons for explaining how bria. works, drawn with the same rules as ShopIcons: 48×48 grid,
 * 2.25 stroke, round joins, `currentColor` for the line and one amber accent detail.
 */
export type StepIconName = "estante" | "curva" | "reloj" | "lejos" | "nuevo" | "aviso" | "prueba";

const D: Record<StepIconName, { line: ReactNode; accent: ReactNode }> = {
  // A shelf: two products on it and a dashed one, the sale that was missed.
  estante: {
    line: (
      <>
        <path d="M8 6v36M40 6v36M8 24h32M8 42h32" />
        <path d="M13 14h9v10h-9zM15 32h10v10H15z" />
      </>
    ),
    accent: <path d="M27 14h9v10h-9z" strokeDasharray="2.6 3" />,
  },
  // Growth with its season on top.
  curva: {
    line: <path d="M8 8v32h32" />,
    accent: <path d="M13 33c4 0 5-8 9-8s4.5 5 8.5 5S35 18 39 14" />,
  },
  // A clock turning back: the test with the past.
  reloj: {
    line: (
      <>
        <path d="M9.5 24A14.5 14.5 0 1 0 14 13.5" />
        <path d="M8 7v8h8" />
      </>
    ),
    accent: <path d="M24 16v8l5.5 3.5" />,
  },
  // A fan that opens with time: the range, and the far future.
  lejos: {
    line: (
      <>
        <path d="M7 24h12" />
        <path d="M19 24 41 12M19 24l22 12" />
      </>
    ),
    accent: <path d="M19 24h22" strokeDasharray="2.6 3.2" />,
  },
  nuevo: {
    line: <circle cx="24" cy="24" r="16" />,
    accent: <path d="M24 16v9M24 31v.5" />,
  },
  aviso: {
    line: (
      <>
        <path d="M14 34V22a10 10 0 0 1 20 0v12l3 4H11Z" />
        <path d="M21 42h6" />
      </>
    ),
    accent: <path d="M24 8v4" />,
  },
  prueba: {
    line: (
      <>
        <path d="M8 40h32" />
        <path d="M12 40V28M20 40V20M28 40V24M36 40V14" />
      </>
    ),
    accent: <path d="M10 22l9-7 8 4 11-9" />,
  },
};

interface StepIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: StepIconName;
  /** Class for the accent detail (defaults to the brand amber). */
  accentClassName?: string;
}

export function StepIcon({ name, accentClassName = "stroke-brand", className, ...props }: StepIconProps) {
  const icon = D[name];
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
      <g className={accentClassName}>{icon.accent}</g>
    </svg>
  );
}
