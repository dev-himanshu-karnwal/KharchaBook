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
import { getBudgets } from "@/actions/budgets";
import type {
  Account,
  BudgetWithStatus,
  Category,
  CreateTransactionInput,
} from "@/lib/types";
import { toast } from "sonner";

export function TransactionDialog() {
  const { open, setOpen } = useTransactionDialog();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    function fetchData() {
      if (!open) return;

      setFormKey((key) => key + 1);
      setDataLoading(true);
      const supabase = createClient();
      Promise.all([
        supabase
          .from("accounts")
          .select("*")
          .eq("is_active", true)
          .order("name"),
        supabase.from("categories").select("*").order("sort_order"),
        getBudgets(),
      ])
        .then(([{ data: a }, { data: c }, budgetsRes]) => {
          setAccounts((a as Account[]) ?? []);
          setCategories((c as Category[]) ?? []);
          setBudgets(budgetsRes.success ? budgetsRes.data : []);
        })
        .finally(() => setDataLoading(false));
    }
    fetchData();
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
            key={formKey}
            accounts={accounts}
            categories={categories}
            budgets={budgets}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
