import { cn, formatCurrency } from "@/lib/utils";

export type MoneyTone =
  | "default"
  | "income"
  | "expense"
  | "transfer"
  | "warning"
  | "muted";

const toneClass: Record<MoneyTone, string> = {
  default: "text-foreground",
  income: "money-pos",
  expense: "money-neg",
  transfer: "money-neutral",
  warning: "text-[var(--warning)]",
  muted: "text-muted-foreground",
};

export function MoneyAmount({
  amount,
  tone = "default",
  signed = false,
  size = "md",
  className,
}: {
  amount: number;
  tone?: MoneyTone;
  /** Prefix + for positive when signed */
  signed?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
    xl: "text-3xl md:text-4xl",
  }[size];

  const prefix = signed && amount > 0 ? "+" : signed && amount < 0 ? "−" : "";
  const display = signed ? Math.abs(amount) : amount;

  return (
    <span
      className={cn(
        "tabular-money font-semibold",
        sizeClass,
        toneClass[tone],
        className
      )}
    >
      {prefix}
      {formatCurrency(display)}
    </span>
  );
}
