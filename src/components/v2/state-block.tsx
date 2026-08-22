import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox, ShieldAlert, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type StateKind = "empty" | "error" | "permission" | "offline";

const defaults: Record<
  StateKind,
  { icon: LucideIcon; title: string; description: string }
> = {
  empty: {
    icon: Inbox,
    title: "Nothing here yet",
    description: "When you add data, it will show up in this view.",
  },
  error: {
    icon: AlertCircle,
    title: "Couldn’t load this",
    description: "Something went wrong fetching data. Try again.",
  },
  permission: {
    icon: ShieldAlert,
    title: "Access unavailable",
    description: "You don’t have permission to view this content.",
  },
  offline: {
    icon: WifiOff,
    title: "You’re offline",
    description: "Reconnect to refresh your financial data.",
  },
};

export function StateBlock({
  kind = "empty",
  icon,
  title,
  description,
  action,
  onRetry,
  className,
}: {
  kind?: StateKind;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  const fallback = defaults[kind];
  const Icon = icon ?? fallback.icon;

  return (
    <div
      role={kind === "error" || kind === "offline" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      <div className="bg-muted/70 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
        <Icon className="text-muted-foreground h-5 w-5" aria-hidden />
      </div>
      <p className="font-heading text-sm font-semibold">
        {title ?? fallback.title}
      </p>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-relaxed">
        {description ?? fallback.description}
      </p>
      {(action || onRetry) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action}
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
