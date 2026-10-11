"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountForm } from "./account-form";
import { createAccount, toggleAccountActive } from "@/actions/accounts";
import { cn } from "@/lib/utils";
import type { Account, CreateAccountInput } from "@/lib/types";
import { toast } from "sonner";
import { runAction } from "@/lib/run-action";
import { PageHeader } from "@/components/v2/page-header";
import { StatusPill } from "@/components/v2/status-pill";
import { PAGE_META } from "@/lib/nav";
import { MoneyAmount } from "@/components/v2/money-amount";

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
};

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const meta = PAGE_META["/accounts"];

  async function handleCreate(data: CreateAccountInput) {
    setLoading(true);
    const result = await runAction(() => createAccount(data));
    setLoading(false);

    if (result.success) {
      toast.success("Account created");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const result = await runAction(() => toggleAccountActive(id, !isActive));
    if (result.success) {
      toast.success(isActive ? "Account deactivated" : "Account activated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        className="mb-0"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add account
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add account</DialogTitle>
              </DialogHeader>
              <AccountForm
                onSubmit={handleCreate}
                onCancel={() => setOpen(false)}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <p className="text-muted-foreground text-sm">
        {accounts.length} account{accounts.length !== 1 ? "s" : ""} · Credit
        cards are managed separately
      </p>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your first bank account, cash, or wallet to start tracking balances."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add account
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={cn(
                "surface-panel p-4 transition-opacity",
                !account.is_active && "opacity-55"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: account.color ?? "#0f766e" }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{account.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {TYPE_LABELS[account.type] ?? account.type}
                    </p>
                  </div>
                </div>
                {!account.is_active && (
                  <StatusPill tone="neutral">Inactive</StatusPill>
                )}
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <MoneyAmount amount={Number(account.balance)} size="lg" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  onClick={() => handleToggle(account.id, account.is_active)}
                >
                  {account.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
