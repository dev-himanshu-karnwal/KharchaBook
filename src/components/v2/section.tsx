import Link from "next/link";
import { cn } from "@/lib/utils";

export function Section({
  title,
  description,
  href,
  hrefLabel = "View all",
  children,
  className,
  bare = false,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  className?: string;
  /** Skip panel chrome — useful inside denser layouts */
  bare?: boolean;
}) {
  return (
    <section className={cn("fade-up space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="text-muted-foreground hover:text-foreground shrink-0 text-xs font-medium transition-colors"
          >
            {hrefLabel}
          </Link>
        )}
      </div>
      {bare ? (
        children
      ) : (
        <div className="surface-panel p-4 md:p-5">{children}</div>
      )}
    </section>
  );
}
