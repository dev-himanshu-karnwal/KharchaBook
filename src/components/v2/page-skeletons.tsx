import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Route-level loading skeletons. They mirror the real page layouts so content
 * doesn't jump when data arrives.
 */

function LoadingRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("space-y-6", className)}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function PageHeaderSkeleton({
  withAction = true,
  className,
}: {
  withAction?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withAction && <Skeleton className="h-7 w-28" />}
    </div>
  );
}

export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-panel space-y-2 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ActivityRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="surface-panel divide-border/60 divide-y overflow-hidden p-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  lines = 1,
}: {
  count?: number;
  /** Extra detail rows under the headline amount */
  lines?: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-panel p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="mt-1 h-2.5 w-2.5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-7 w-32" />
            {Array.from({ length: lines - 1 }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-panel space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TabsSkeleton({ tabs = 3 }: { tabs?: number }) {
  return (
    <div className="bg-muted/60 inline-flex gap-1 rounded-lg p-1">
      {Array.from({ length: tabs }).map((_, i) => (
        <Skeleton key={i} className="bg-background/70 h-7 w-20" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Full-page skeletons                                                      */
/* ------------------------------------------------------------------------ */

export function DashboardSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard…" className="space-y-8">
      <PageHeaderSkeleton className="hidden lg:flex" />

      <div className="surface-panel grid gap-8 p-5 md:p-7 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-[4.5rem] rounded-xl" />
            <Skeleton className="h-[4.5rem] rounded-xl" />
          </div>
        </div>
        <div className="border-border/70 space-y-4 border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-40" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <ListCardsSkeleton count={1} />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="surface-panel flex flex-col gap-6 p-5 sm:flex-row">
              <Skeleton className="mx-auto h-40 w-40 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-5 w-28" />
            <div className="surface-panel space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <ActivityRowsSkeleton rows={4} />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

export function TransactionsSkeleton() {
  return (
    <LoadingRegion label="Loading activity…">
      <PageHeaderSkeleton className="hidden lg:flex" />
      <StatTilesSkeleton count={3} />
      <div className="surface-panel space-y-3 p-3 md:p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-full sm:w-32" />
          <Skeleton className="h-8 w-full sm:w-32" />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="ml-1 h-3 w-24" />
          <ActivityRowsSkeleton rows={i === 0 ? 4 : 3} />
        </div>
      ))}
    </LoadingRegion>
  );
}

export function AccountsSkeleton() {
  return (
    <LoadingRegion label="Loading accounts…">
      <PageHeaderSkeleton />
      <Skeleton className="h-4 w-56" />
      <CardGridSkeleton count={3} />
    </LoadingRegion>
  );
}

export function CreditCardsSkeleton() {
  return (
    <LoadingRegion label="Loading credit cards…">
      <PageHeaderSkeleton />
      <Skeleton className="h-4 w-56" />
      <CardGridSkeleton count={3} lines={4} />
    </LoadingRegion>
  );
}

export function LoansSkeleton() {
  return (
    <LoadingRegion label="Loading loans…">
      <PageHeaderSkeleton />
      <StatTilesSkeleton count={2} />
      <TabsSkeleton />
      <ListCardsSkeleton count={3} />
    </LoadingRegion>
  );
}

export function BudgetsSkeleton() {
  return (
    <LoadingRegion label="Loading budgets…">
      <PageHeaderSkeleton />
      <TabsSkeleton tabs={4} />
      <ListCardsSkeleton count={3} />
    </LoadingRegion>
  );
}

export function CategoriesSkeleton() {
  return (
    <LoadingRegion label="Loading categories…">
      <PageHeaderSkeleton withAction={false} />
      <StatTilesSkeleton count={4} />
      <div className="surface-panel space-y-4 p-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-8 sm:col-span-2" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </div>
      <div className="flex justify-center">
        <TabsSkeleton tabs={2} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel space-y-4 p-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mx-auto h-44 w-44 rounded-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="surface-panel space-y-2 p-4">
          <Skeleton className="mb-2 h-5 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
