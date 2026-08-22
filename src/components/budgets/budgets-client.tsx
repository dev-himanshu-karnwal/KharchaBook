"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { createBudget, deleteBudget, updateBudget } from "@/actions/budgets";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBudgetProgressColor } from "@/lib/expense-budget";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  BudgetLifecycle,
  BudgetWithStatus,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/lib/types";
import { toast } from "sonner";
import { PageHeader } from "@/components/v2/page-header";
import { PAGE_META } from "@/lib/nav";

type TabFilter = "active" | "upcoming" | "past" | "all";

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: BudgetWithStatus;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = Math.min(budget.utilizationPercent, 100);
  const progressColor = getBudgetProgressColor(budget.utilizationPercent);

  return (
    <Card className="hover:ring-foreground/20 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{budget.name}</p>
              <Badge variant="outline" className="text-[10px] capitalize">
                {budget.period_type}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {formatDate(budget.start_date)} – {formatDate(budget.end_date)}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onEdit}
              aria-label="Edit budget"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              aria-label="Delete budget"
            >
              <Trash2 className="text-destructive h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
            </span>
          </div>

          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {budget.remaining >= 0 ? "Remaining" : "Over by"}
            </span>
            <span
              className={cn(
                "font-medium tabular-nums",
                budget.remaining < 0 && "text-red-400"
              )}
            >
              {formatCurrency(Math.abs(budget.remaining))}
            </span>
          </div>
        </div>

        {budget.warnings.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {budget.warnings.map((warning) => (
              <Badge
                key={warning.level}
                variant={
                  warning.level === "over_budget" ? "destructive" : "secondary"
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
}

export function BudgetsClient({
  initialBudgets,
}: {
  initialBudgets: BudgetWithStatus[];
}) {
  const router = useRouter();
  const [budgets, setBudgets] = useState(initialBudgets);
  const [tab, setTab] = useState<TabFilter>("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithStatus | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  const filtered = useMemo(() => {
    if (tab === "all") return budgets;
    return budgets.filter((b) => b.lifecycle === tab);
  }, [budgets, tab]);

  const tabCounts = useMemo(() => {
    const counts: Record<BudgetLifecycle | "all", number> = {
      active: 0,
      upcoming: 0,
      past: 0,
      all: budgets.length,
    };
    for (const b of budgets) {
      counts[b.lifecycle]++;
    }
    return counts;
  }, [budgets]);

  async function handleCreate(data: CreateBudgetInput | UpdateBudgetInput) {
    setLoading(true);
    const result = await createBudget(data as CreateBudgetInput);
    setLoading(false);

    if (result.success) {
      toast.success("Budget created");
      setCreateOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleUpdate(data: CreateBudgetInput | UpdateBudgetInput) {
    if (!editBudget) return;

    setLoading(true);
    const result = await updateBudget(editBudget.id, data as UpdateBudgetInput);
    setLoading(false);

    if (result.success) {
      toast.success("Budget updated");
      setEditBudget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    setLoading(true);
    const result = await deleteBudget(deleteId);
    setLoading(false);

    if (result.success) {
      toast.success("Budget deleted");
      setBudgets((prev) => prev.filter((b) => b.id !== deleteId));
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE_META["/budgets"].title}
        subtitle={PAGE_META["/budgets"].subtitle}
        className="mb-0"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add budget
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create budget</DialogTitle>
              </DialogHeader>
              <BudgetForm
                onSubmit={handleCreate}
                onCancel={() => setCreateOpen(false)}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
        <TabsList>
          <TabsTrigger value="active">Active ({tabCounts.active})</TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({tabCounts.upcoming})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({tabCounts.past})</TabsTrigger>
          <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={
            tab === "active"
              ? "No active budgets"
              : tab === "upcoming"
                ? "No upcoming budgets"
                : tab === "past"
                  ? "No past budgets"
                  : "No budgets yet"
          }
          description={
            tab === "all" || tab === "active"
              ? "Set a spending limit to track your expenses and stay on budget."
              : `No ${tab} budgets to show.`
          }
          action={
            (tab === "all" || tab === "active") && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Budget
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={() => setEditBudget(budget)}
              onDelete={() => setDeleteId(budget.id)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!editBudget}
        onOpenChange={(open) => !open && setEditBudget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          {editBudget && (
            <BudgetForm
              budget={editBudget}
              onSubmit={handleUpdate}
              onCancel={() => setEditBudget(null)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete budget?"
        description="This will remove the budget. Your transaction history will not be affected."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
