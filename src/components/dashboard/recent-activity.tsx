import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  activityAmountColor,
  activityAmountPrefix,
  activityTypeLabel,
  getSignedAmount,
  type ActivityItem,
} from "@/lib/activity-feed";
import type { PersonalLoan } from "@/lib/types";
import { ArrowRight } from "lucide-react";

function ActivityRow({
  item,
  signedAmount,
}: {
  item: ActivityItem;
  signedAmount: number;
}) {
  const isLoan =
    item.displayType === "loan_lent" ||
    item.displayType === "loan_borrowed" ||
    item.displayType === "loan_repayment";

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium">{item.title}</p>
            {isLoan && (
              <Badge variant="outline" className="text-[10px] text-violet-400">
                {activityTypeLabel(item)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {formatDate(item.date)}
            {item.subtitle && <> · {item.subtitle}</>}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          activityAmountColor(item)
        )}
      >
        {activityAmountPrefix(item, signedAmount)}
        {formatCurrency(Math.abs(signedAmount))}
      </span>
    </div>
  );
}

export function RecentActivity({
  items,
  loans,
  limit = 8,
}: {
  items: ActivityItem[];
  loans: PersonalLoan[];
  limit?: number;
}) {
  const recent = items.slice(0, limit);

  if (recent.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Recent Activity
        </CardTitle>
        <Link
          href="/transactions"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="divide-y">
        {recent.map((item) => (
          <ActivityRow
            key={item.id}
            item={item}
            signedAmount={getSignedAmount(item, loans)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
