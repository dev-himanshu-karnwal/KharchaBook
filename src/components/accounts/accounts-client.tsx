"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountForm } from "./account-form";
import { createAccount, toggleAccountActive } from "@/actions/accounts";
import { formatCurrency, cn } from "@/lib/utils";
import type { Account, CreateAccountInput } from "@/lib/types";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
  credit_card: "Credit Card",
};

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(data: CreateAccountInput) {
    setLoading(true);
    const result = await createAccount(data);
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
    const result = await toggleAccountActive(id, !isActive);
    if (result.success) {
      toast.success(isActive ? "Account deactivated" : "Account activated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Account
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
            </DialogHeader>
            <AccountForm
              onSubmit={handleCreate}
              onCancel={() => setOpen(false)}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No accounts yet. Add your first bank account, cash wallet, or credit card.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={cn(
                "transition-opacity",
                !account.is_active && "opacity-50",
              )}
            >
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: account.color ?? "#3b82f6" }}
                  />
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {TYPE_LABELS[account.type]}
                      </span>
                      {!account.is_active && (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xl font-bold tabular-nums">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => handleToggle(account.id, account.is_active)}
                >
                  {account.is_active ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
