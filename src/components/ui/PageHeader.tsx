import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Buttons on the right (primary action last). */
  action?: ReactNode;
}

/** Screen title. The section name already shows in the top bar, so there is no eyebrow. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    // data-sw-keep: with the page going sideways the header stays whole, one line across the top.
    <div data-sw-keep="" className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary sm:text-[32px]">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-pretty text-[15px] leading-relaxed text-text-secondary">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
