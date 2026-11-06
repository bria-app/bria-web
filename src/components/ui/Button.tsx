import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * primary   amber, the single most important action on a screen (Crear, Cobrar, Ingresar)
 * strong    ink, confirmations and secondary-but-solid actions (Guardar, Registrar)
 * secondary outlined, neutral actions
 * ghost     text-only, low emphasis
 * danger    destructive actions (Anular, Borrar)
 */
type Variant = "primary" | "strong" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  strong: "btn-strong",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

// `.btn` provides layout, radius and motion; sizes only add height / padding / text / gap.
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn("btn", variants[variant], sizes[size], "disabled:pointer-events-none disabled:opacity-50", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
