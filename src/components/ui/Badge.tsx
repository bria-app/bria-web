import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  accent: "bg-primary-soft text-accent-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

/** Status pill. Always carries a text label; color only reinforces it. */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}
