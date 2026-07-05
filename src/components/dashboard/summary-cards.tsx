import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PiggyBank,
  CreditCard,
  Scale,
} from "lucide-react";
import type { MonthlySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const cards = [
  {
    key: "assets" as const,
    label: "Assets",
    icon: Wallet,
    colorClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
  },
  {
    key: "creditCardOutstanding" as const,
    label: "Credit Card Outstanding",
    icon: CreditCard,
    colorClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
  },
  {
    key: "netWorth" as const,
    label: "Net Worth",
    icon: Scale,
    colorClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
  },
  {
    key: "monthlyIncome" as const,
    label: "Monthly Income",
    icon: TrendingUp,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
  },
  {
    key: "monthlyExpenses" as const,
    label: "Monthly Expenses",
    icon: TrendingDown,
    colorClass: "text-red-400",
    bgClass: "bg-red-400/10",
  },
  {
    key: "netSavings" as const,
    label: "Net Savings",
    icon: PiggyBank,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
  },
];

export function SummaryCards({ summary }: { summary: MonthlySummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ key, label, icon: Icon, colorClass, bgClass }) => (
        <Card key={key} className="hover:ring-foreground/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {label}
            </CardTitle>
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                bgClass
              )}
            >
              <Icon className={cn("h-4 w-4", colorClass)} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {formatCurrency(summary[key])}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
