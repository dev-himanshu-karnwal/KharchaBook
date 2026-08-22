import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fade-up mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          KharchaBook
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
