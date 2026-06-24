"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTransactionDialog } from "@/components/providers/transaction-dialog-provider";
import { TransactionForm } from "./transaction-form";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { createTransaction } from "@/actions/transactions";
import type { Account, Category, CreateTransactionInput } from "@/lib/types";
import { toast } from "sonner";

export function TransactionDialog() {
  const { open, setOpen } = useTransactionDialog();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setDataLoading(true);
    const supabase = createClient();
    Promise.all([
      supabase.from("accounts").select("*").eq("is_active", true).order("name"),
      supabase.from("categories").select("*").order("sort_order"),
    ])
      .then(([{ data: a }, { data: c }]) => {
        setAccounts((a as Account[]) ?? []);
        setCategories((c as Category[]) ?? []);
      })
      .finally(() => setDataLoading(false));
  }, [open]);

  async function handleSubmit(data: CreateTransactionInput) {
    setLoading(true);
    const result = await createTransaction(data);
    setLoading(false);

    if (result.success) {
      toast.success("Transaction added");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        {dataLoading && accounts.length === 0 ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-2/3" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Add an account first before recording transactions.
          </p>
        ) : (
          <TransactionForm
            accounts={accounts}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
