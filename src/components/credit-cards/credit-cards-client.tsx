"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCardForm } from "./credit-card-form";
import { createCreditCard, toggleAccountActive } from "@/actions/accounts";
import {
  computeCreditCardMetrics,
  formatDueDay,
  formatUtilization,
  getCreditCardWarnings,
} from "@/lib/credit-card";
import { formatCurrency, cn } from "@/lib/utils";
import type { Account, CreateCreditCardInput } from "@/lib/types";
import { toast } from "sonner";

export function CreditCardsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(data: CreateCreditCardInput) {
    setLoading(true);
    const result = await createCreditCard(data);
    setLoading(false);

    if (result.success) {
      toast.success("Credit card added");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const result = await toggleAccountActive(id, !isActive);
    if (result.success) {
      toast.success(
        isActive ? "Credit card deactivated" : "Credit card activated"
      );
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {accounts.length} credit card{accounts.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Credit Card
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Credit Card</DialogTitle>
            </DialogHeader>
            <CreditCardForm
              onSubmit={handleCreate}
              onCancel={() => setOpen(false)}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No credit cards yet"
          description="Add a credit card to track outstanding balance, available credit, and payment due dates."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const metrics = computeCreditCardMetrics(account);
            const warnings = getCreditCardWarnings(account);
            const dueLabel = formatDueDay(account.payment_due_day);
            const utilizationLabel = formatUtilization(
              metrics?.utilizationPercent ?? null
            );

            return (
              <Card
                key={account.id}
                className={cn(
                  "hover:ring-foreground/20 transition-all",
                  !account.is_active && "opacity-50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/10"
                          style={{
                            backgroundColor: account.color ?? "#3b82f6",
                          }}
                        />
                        <p className="truncate font-medium">{account.name}</p>
                      </div>
                      {account.card_last4 && (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          •••• {account.card_last4}
                        </p>
                      )}
                      {!account.is_active && (
                        <Badge variant="secondary" className="mt-2 text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground shrink-0 text-xs"
                      onClick={() =>
                        handleToggle(account.id, account.is_active)
                      }
                    >
                      {account.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(metrics?.outstanding ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium tabular-nums">
                        {metrics?.availableCredit != null
                          ? formatCurrency(metrics.availableCredit)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Limit</span>
                      <span className="font-medium tabular-nums">
                        {account.credit_limit !== null
                          ? formatCurrency(account.credit_limit)
                          : "—"}
                      </span>
                    </div>
                    {utilizationLabel && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Utilization
                        </span>
                        <span className="font-medium tabular-nums">
                          {utilizationLabel}
                        </span>
                      </div>
                    )}
                    {dueLabel && (
                      <p className="text-muted-foreground text-xs">
                        {dueLabel}
                      </p>
                    )}
                  </div>

                  {warnings.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {warnings.map((warning) => (
                        <Badge
                          key={warning.level}
                          variant={
                            warning.level === "over_limit"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {warning.message}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
