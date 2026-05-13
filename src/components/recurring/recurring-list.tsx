"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RecurringForm } from "./recurring-form";
import {
  createRecurring,
  updateRecurring,
  deleteRecurring,
  toggleRecurringActive,
} from "@/actions/recurring";
import { createClient } from "@/utils/supabase/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type {
  Account,
  Category,
  CreateRecurringInput,
  RecurringTransaction,
} from "@/lib/types";
import { toast } from "sonner";

const TAG_COLORS: Record<string, string> = {
  emi: "bg-red-500/10 text-red-400",
  sip: "bg-emerald-500/10 text-emerald-400",
  subscription: "bg-purple-500/10 text-purple-400",
  salary: "bg-green-500/10 text-green-400",
  rent: "bg-orange-500/10 text-orange-400",
  insurance: "bg-blue-500/10 text-blue-400",
  other: "bg-gray-500/10 text-gray-400",
};

export function RecurringList({
  recurring,
}: {
  recurring: RecurringTransaction[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const dialogOpen = open || !!editingItem;

  useEffect(() => {
    if (!dialogOpen) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("accounts").select("*").eq("is_active", true).order("name"),
      supabase.from("categories").select("*").order("sort_order"),
    ]).then(([{ data: a }, { data: c }]) => {
      setAccounts((a as Account[]) ?? []);
      setCategories((c as Category[]) ?? []);
    });
  }, [dialogOpen]);

  async function handleCreate(data: CreateRecurringInput) {
    setLoading(true);
    const result = await createRecurring(data);
    setLoading(false);

    if (result.success) {
      toast.success("Recurring transaction added");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleUpdate(data: CreateRecurringInput) {
    if (!editingItem) return;
    setLoading(true);
    const result = await updateRecurring(editingItem.id, data);
    setLoading(false);

    if (result.success) {
      toast.success("Recurring transaction updated");
      setEditingItem(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteRecurring(id);
    if (result.success) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const result = await toggleRecurringActive(id, !isActive);
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recurring.length} recurring transaction{recurring.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Recurring
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Recurring Transaction</DialogTitle>
            </DialogHeader>
            {accounts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Add an account first.
              </p>
            ) : (
              <RecurringForm
                accounts={accounts}
                categories={categories}
                onSubmit={handleCreate}
                onCancel={() => setOpen(false)}
                loading={loading}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingItem} onOpenChange={(v) => !v && setEditingItem(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Recurring Transaction</DialogTitle>
            </DialogHeader>
            {editingItem && accounts.length > 0 && (
              <RecurringForm
                accounts={accounts}
                categories={categories}
                onSubmit={handleUpdate}
                onCancel={() => setEditingItem(null)}
                loading={loading}
                initialData={editingItem}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {recurring.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No recurring transactions. Track your EMIs, SIPs, subscriptions, and salary
          here.
        </p>
      ) : (
        <div className="space-y-2">
          {recurring.map((rec) => (
            <div
              key={rec.id}
              className={cn(
                "group flex items-center justify-between rounded-lg border border-border p-4 transition-opacity",
                !rec.is_active && "opacity-50",
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{rec.name}</p>
                  {rec.tag && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] uppercase",
                        TAG_COLORS[rec.tag] ?? "",
                      )}
                    >
                      {rec.tag}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {rec.frequency} &middot; {rec.account?.name} &middot; Next due{" "}
                  {formatDate(rec.next_due_date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    rec.type === "income" ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {formatCurrency(rec.amount)}
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => handleToggle(rec.id, rec.is_active)}
                  >
                    {rec.is_active ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingItem(rec)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(rec.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
