import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAssetAccount } from "@/lib/account-balance";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/lib/types";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
};

export function AccountBalances({ accounts }: { accounts: Account[] }) {
  const assetAccounts = accounts.filter(
    (account) => account.is_active && isAssetAccount(account)
  );

  if (assetAccounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            No asset accounts yet.{" "}
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
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Manage
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {assetAccounts.map((account) => (
          <div
            key={account.id}
            className="hover:bg-muted/50 -mx-2 flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: account.color ?? "#3b82f6" }}
              />
              <div>
                <p className="text-sm font-medium">{account.name}</p>
                <p className="text-muted-foreground text-xs">
                  {TYPE_LABELS[account.type] ?? account.type}
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
