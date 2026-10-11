"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { runAction } from "@/lib/run-action";
import { PageHeader } from "@/components/v2/page-header";
import { StatusPill } from "@/components/v2/status-pill";
import { MoneyAmount } from "@/components/v2/money-amount";
import { PAGE_META } from "@/lib/nav";

export function CreditCardsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(data: CreateCreditCardInput) {
    setLoading(true);
    const result = await runAction(() => createCreditCard(data));
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
    const result = await runAction(() => toggleAccountActive(id, !isActive));
    if (result.success) {
      toast.success(
        isActive ? "Credit card deactivated" : "Credit card activated"
      );
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const meta = PAGE_META["/credit-cards"];

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
              Add credit card
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add credit card</DialogTitle>
              </DialogHeader>
              <CreditCardForm
                onSubmit={handleCreate}
                onCancel={() => setOpen(false)}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <p className="text-muted-foreground text-sm">
        {accounts.length} credit card{accounts.length !== 1 ? "s" : ""} ·
        Outstanding is liability, not spendable cash
      </p>

      {accounts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No credit cards yet"
          description="Add a credit card to track outstanding balance, available credit, and payment due dates."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add credit card
            </Button>
          }
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
              <div
                key={account.id}
                className={cn(
                  "surface-panel p-4 transition-opacity",
                  !account.is_active && "opacity-55"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: account.color ?? "#0f766e",
                        }}
                        aria-hidden
                      />
                      <p className="truncate font-medium">{account.name}</p>
                    </div>
                    {account.card_last4 && (
                      <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                        •••• {account.card_last4}
                      </p>
                    )}
                    {!account.is_active && (
                      <div className="mt-2">
                        <StatusPill tone="neutral">Inactive</StatusPill>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground shrink-0 text-xs"
                    onClick={() => handleToggle(account.id, account.is_active)}
                  >
                    {account.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Outstanding</span>
                    <MoneyAmount
                      amount={metrics?.outstanding ?? 0}
                      size="sm"
                      tone="expense"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="tabular-money text-sm font-medium">
                      {metrics?.availableCredit != null
                        ? formatCurrency(metrics.availableCredit)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Limit</span>
                    <span className="tabular-money text-sm font-medium">
                      {account.credit_limit !== null
                        ? formatCurrency(account.credit_limit)
                        : "—"}
                    </span>
                  </div>
                  {utilizationLabel && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="tabular-money text-sm font-medium">
                        {utilizationLabel}
                      </span>
                    </div>
                  )}
                  {dueLabel && (
                    <p className="text-muted-foreground text-xs">{dueLabel}</p>
                  )}
                </div>

                {warnings.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {warnings.map((warning) => (
                      <StatusPill
                        key={warning.level}
                        tone={
                          warning.level === "over_limit" ? "danger" : "warning"
                        }
                      >
                        {warning.message}
                      </StatusPill>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
