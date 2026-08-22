import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success:
    "bg-[color-mix(in_oklch,var(--income)_16%,transparent)] text-[var(--income)]",
  warning:
    "bg-[color-mix(in_oklch,var(--warning)_18%,transparent)] text-[var(--warning)]",
  danger:
    "bg-[color-mix(in_oklch,var(--expense)_16%,transparent)] text-[var(--expense)]",
  info: "bg-[color-mix(in_oklch,var(--transfer)_16%,transparent)] text-[var(--transfer)]",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
