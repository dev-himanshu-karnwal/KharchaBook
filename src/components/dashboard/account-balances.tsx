import Link from "next/link";
import { isAssetAccount } from "@/lib/account-balance";
import { MoneyAmount } from "@/components/v2/money-amount";
import { Section } from "@/components/v2/section";
import { StateBlock } from "@/components/v2/state-block";
import type { Account } from "@/lib/types";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Section
        title="Accounts"
        description="Asset balances available to spend"
        bare
      >
        <div className="surface-panel">
          <StateBlock
            kind="empty"
            icon={Wallet}
            title="No asset accounts yet"
            description="Add a bank, cash, or wallet account to start tracking balances."
            action={
              <Button size="sm" render={<Link href="/accounts" />}>
                Add account
              </Button>
            }
          />
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Accounts"
      description="Asset balances available to spend"
      href="/accounts"
      hrefLabel="Manage"
    >
      <ul className="divide-border/70 -mx-1 divide-y">
        {assetAccounts.map((account) => (
          <li
            key={account.id}
            className="flex items-center justify-between gap-3 px-1 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: account.color ?? "#0f766e" }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="text-muted-foreground text-xs">
                  {TYPE_LABELS[account.type] ?? account.type}
                </p>
              </div>
            </div>
            <MoneyAmount amount={Number(account.balance)} size="sm" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
