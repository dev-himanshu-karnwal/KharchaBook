import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityRow } from "@/components/shared/activity-row";
import { getSignedAmount, type ActivityItem } from "@/lib/activity-feed";
import type { PersonalLoan } from "@/lib/types";
import { ArrowRight, Receipt } from "lucide-react";

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Recent Activity
        </CardTitle>
        {recent.length > 0 && (
          <Link
            href="/transactions"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No activity this month"
            description="Transactions and loans you record will show up here."
            className="py-8"
          />
        ) : (
          <div className="divide-y">
            {recent.map((item) => (
              <ActivityRow
                key={item.id}
                item={item}
                signedAmount={getSignedAmount(item, loans)}
                showDate
                compact
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
