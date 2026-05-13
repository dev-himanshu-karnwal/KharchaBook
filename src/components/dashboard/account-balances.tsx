import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/lib/types";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
  credit_card: "Credit Card",
};

export function AccountBalances({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No accounts yet.{" "}
            <Link href="/accounts" className="text-primary hover:underline">
              Add your first account
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Accounts</CardTitle>
        <Link
          href="/accounts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Manage
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: account.color ?? "#3b82f6" }}
              />
              <div>
                <p className="text-sm font-medium">{account.name}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[account.type]}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(account.balance)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
