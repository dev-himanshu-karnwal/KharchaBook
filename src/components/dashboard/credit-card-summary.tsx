import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sumCreditCardOutstanding } from "@/lib/account-balance";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/lib/types";
import Link from "next/link";

export function CreditCardSummary({ accounts }: { accounts: Account[] }) {
  const activeCards = accounts.filter(
    (account) => account.type === "credit_card" && account.is_active
  );
  const totalOutstanding = sumCreditCardOutstanding(accounts);

  if (activeCards.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Credit Cards</CardTitle>
        <Link
          href="/credit-cards"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">Total outstanding</p>
        <p className="text-xl font-bold tracking-tight tabular-nums">
          {formatCurrency(totalOutstanding)}
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          {activeCards.length} active card{activeCards.length !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
