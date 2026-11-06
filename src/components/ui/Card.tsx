import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a hover state for cards that open something. */
  interactive?: boolean;
}

/** Surface container: white (or dark surface) panel with a hairline border. */
export function Card({ className, children, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-6 transition-[border-color,box-shadow] duration-200",
        interactive && "hover:border-text-muted/40 hover:shadow-soft",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
