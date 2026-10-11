"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTransactionDialog } from "@/components/providers/transaction-dialog-provider";
import { TransactionForm } from "./transaction-form";
import { Skeleton } from "@/components/ui/skeleton";
import { StateBlock } from "@/components/v2/state-block";
import { createTransaction } from "@/actions/transactions";
import type { CreateTransactionInput } from "@/lib/types";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function TransactionFormSkeleton() {
  return (
    <div className="space-y-4 py-1" aria-busy="true" aria-live="polite">
      <Skeleton className="h-4 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[3.25rem] w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-8 w-full" />
      <span className="sr-only">Loading accounts…</span>
    </div>
  );
}

export function TransactionDialog() {
  const { open, setOpen, data, prefetch, invalidate } = useTransactionDialog();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset the form every time the dialog opens.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setFormKey((key) => key + 1);
  }

  function handleOpenChange(next: boolean) {
    // Don't let an accidental outside click discard an in-flight save.
    if (!next && saving) return;
    setOpen(next);
  }

  async function handleSubmit(input: CreateTransactionInput) {
    setSaving(true);
    try {
      const result = await createTransaction(input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Transaction added");
      setOpen(false);
      invalidate();
      // Refresh server data in the background — the dialog is already closed.
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Couldn’t save the transaction. Check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const { accounts, categories, budgets, ready, error } = data;

  let body: React.ReactNode;
  if (!ready && error) {
    body = (
      <StateBlock
        kind="error"
        description={error}
        onRetry={() => {
          invalidate();
          prefetch();
        }}
        className="py-6"
      />
    );
  } else if (!ready) {
    body = <TransactionFormSkeleton />;
  } else if (accounts.length === 0) {
    body = (
      <StateBlock
        icon={Wallet}
        title="No accounts yet"
        description="Add a bank, cash or wallet account before recording transactions."
        action={
          <Button
            size="sm"
            render={<Link href="/accounts" />}
            onClick={() => setOpen(false)}
          >
            Add an account
          </Button>
        }
        className="py-6"
      />
    );
  } else {
    body = (
      <TransactionForm
        key={formKey}
        accounts={accounts}
        categories={categories}
        budgets={budgets}
        onSubmit={handleSubmit}
        onCancel={() => handleOpenChange(false)}
        loading={saving}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription className="sr-only">
            Record an expense, income or transfer.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
