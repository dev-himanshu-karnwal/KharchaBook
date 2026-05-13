import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import type { MonthlySummary } from "@/lib/types";

const cards = [
  {
    key: "totalBalance" as const,
    label: "Total Balance",
    icon: Wallet,
    colorClass: "text-blue-400",
  },
  {
    key: "monthlyIncome" as const,
    label: "Monthly Income",
    icon: TrendingUp,
    colorClass: "text-emerald-400",
  },
  {
    key: "monthlyExpenses" as const,
    label: "Monthly Expenses",
    icon: TrendingDown,
    colorClass: "text-red-400",
  },
  {
    key: "netSavings" as const,
    label: "Net Savings",
    icon: PiggyBank,
    colorClass: "text-amber-400",
  },
];

export function SummaryCards({ summary }: { summary: MonthlySummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, colorClass }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className={`h-4 w-4 ${colorClass}`} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary[key])}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
