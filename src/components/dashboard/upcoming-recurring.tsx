import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { RecurringTransaction } from "@/lib/types";
import Link from "next/link";

export function UpcomingRecurring({
  recurring,
}: {
  recurring: RecurringTransaction[];
}) {
  if (recurring.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Obligations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No upcoming obligations. Add recurring transactions to track EMIs, SIPs, and
            subscriptions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Upcoming Obligations</CardTitle>
        <Link
          href="/recurring"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {recurring.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium">{rec.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    Due {formatDateShort(rec.next_due_date)}
                  </p>
                  {rec.tag && (
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {rec.tag}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <span
              className={`text-sm font-semibold tabular-nums ${
                rec.type === "income" ? "text-emerald-500" : "text-red-400"
              }`}
            >
              {rec.type === "income" ? "+" : "-"}
              {formatCurrency(rec.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
