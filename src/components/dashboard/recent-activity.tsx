import Link from "next/link";
import { ActivityRow } from "@/components/shared/activity-row";
import { Section } from "@/components/v2/section";
import { StateBlock } from "@/components/v2/state-block";
import { getSignedAmount, type ActivityItem } from "@/lib/activity-feed";
import type { PersonalLoan } from "@/lib/types";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Section
      title="Recent activity"
      description="This month’s movements"
      href={recent.length > 0 ? "/transactions" : undefined}
      hrefLabel="View all"
      bare={recent.length === 0}
    >
      {recent.length === 0 ? (
        <div className="surface-panel">
          <StateBlock
            kind="empty"
            icon={Receipt}
            title="No activity this month"
            description="Transactions and loans you record will show up here."
            action={
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/transactions" />}
              >
                Go to activity
              </Button>
            }
            className="py-8"
          />
        </div>
      ) : (
        <div className="divide-border/70 -mx-1 divide-y">
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
    </Section>
  );
}
