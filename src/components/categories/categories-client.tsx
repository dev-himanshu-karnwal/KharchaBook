"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createCategory,
  deleteCategory,
  getCategoryStats,
  type CategoryStats,
  type CategoryStatsSummary,
} from "@/actions/categories";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryTransactionsSheet } from "@/components/categories/category-transactions-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category, CategoryType } from "@/lib/types";
import { PageHeader } from "@/components/v2/page-header";
import { PAGE_META } from "@/lib/nav";
import { MoneyAmount } from "@/components/v2/money-amount";
import {
  categoryFiltersToSearchParams,
  getDateRangeFromFilters,
  parseCategoryFilters,
  type CategoryPageFilters,
} from "@/lib/category-filters";
import { cn, formatCurrency, getMonthRange, toISODate } from "@/lib/utils";
import { Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

function CategoryBar({
  item,
  maxAmount,
  selected,
  onSelect,
}: {
  item: CategoryStats;
  maxAmount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const width = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full space-y-1.5 rounded-lg p-2 text-left transition-colors",
        selected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate font-medium">{item.categoryName}</span>
        </div>
        <span className="shrink-0 font-semibold tabular-nums">
          {formatCurrency(item.amount)}
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: item.color }}
        />
      </div>
    </button>
  );
}

function DonutChart({ data, total }: { data: CategoryStats[]; total: number }) {
  const size = 180;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div
      className="relative mx-auto shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {total === 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
        ) : (
          data.map((item) => {
            const fraction = item.amount / total;
            const dash = fraction * circumference;
            const segment = (
              <circle
                key={item.categoryId}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                className="transition-all duration-500"
              />
            );
            offset += dash;
            return segment;
          })
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-xs">Total</p>
        <p className="text-lg font-bold tabular-nums">
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}

export function CategoriesClient({
  categories,
  initialStats,
  usedCategoryIds,
}: {
  categories: Category[];
  initialStats: CategoryStatsSummary;
  /** Custom categories referenced by any transaction; null if unknown. */
  usedCategoryIds: string[] | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () =>
      parseCategoryFilters(
        new URLSearchParams(searchParams.toString()),
        getMonthRange()
      ),
    [searchParams]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState(initialStats);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const usedIds = useMemo(
    () => (usedCategoryIds ? new Set(usedCategoryIds) : null),
    [usedCategoryIds]
  );
  const [isPending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);

  const updateFilters = useCallback(
    (
      patch:
        | Partial<CategoryPageFilters>
        | ((prev: CategoryPageFilters) => CategoryPageFilters)
    ) => {
      const prev = parseCategoryFilters(
        new URLSearchParams(searchParams.toString()),
        getMonthRange()
      );
      const next =
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      const qs = categoryFiltersToSearchParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const activeRange = useMemo(
    () => getDateRangeFromFilters(filters),
    [filters]
  );

  const fetchStats = useCallback((start: string, end: string) => {
    startTransition(async () => {
      const result = await getCategoryStats(start, end, "all");
      if (result.success) {
        setStats(result.data);
        setSelectedId(null);
      }
    });
  }, []);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    if (
      filters.period === "custom" &&
      (!filters.dateFrom ||
        !filters.dateTo ||
        filters.dateFrom > filters.dateTo)
    ) {
      return;
    }
    fetchStats(activeRange.start, activeRange.end);
  }, [
    activeRange.start,
    activeRange.end,
    filters.period,
    filters.dateFrom,
    filters.dateTo,
    fetchStats,
  ]);

  const filteredCategories = useMemo(() => {
    let rows = stats.categories.filter((c) => c.type === filters.type);

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter((c) => c.categoryName.toLowerCase().includes(q));
    }

    if (filters.hideEmpty) {
      rows = rows.filter((c) => c.transactionCount > 0);
    }

    rows = [...rows].sort((a, b) => {
      switch (filters.sort) {
        case "name":
          return a.categoryName.localeCompare(b.categoryName);
        case "count":
          return b.transactionCount - a.transactionCount;
        case "amount":
        default:
          return b.amount - a.amount;
      }
    });

    return rows;
  }, [
    stats.categories,
    filters.type,
    filters.search,
    filters.hideEmpty,
    filters.sort,
  ]);

  const chartData = useMemo(() => {
    return filteredCategories
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [filteredCategories]);

  const chartTotal = chartData.reduce((sum, c) => sum + c.amount, 0);
  const maxChartAmount = chartData[0]?.amount ?? 0;

  const activeCategories = stats.categories.filter(
    (c) => c.transactionCount > 0
  ).length;
  const topCategory = [...stats.categories].sort(
    (a, b) => b.amount - a.amount
  )[0];

  const showClearFilters = filters.search.trim() !== "" || filters.hideEmpty;

  function handleReportTypeChange(type: CategoryType) {
    updateFilters({ type });
    setSelectedId((id) => {
      if (!id) return null;
      const cat = stats.categories.find((c) => c.categoryId === id);
      return cat?.type === type ? id : null;
    });
  }

  const selectedCategory = useMemo(
    () => stats.categories.find((c) => c.categoryId === selectedId) ?? null,
    [stats.categories, selectedId]
  );

  function selectCategory(categoryId: string) {
    setSelectedId((current) => (current === categoryId ? null : categoryId));
  }

  async function handleCreate(data: {
    name: string;
    type: CategoryType;
    color: string | null;
  }) {
    setCreating(true);
    try {
      const result = await createCategory(data.name, data.type, data.color);
      if (result.success) {
        toast.success("Category created");
        setCreateOpen(false);
        router.refresh();
        fetchStats(activeRange.start, activeRange.end);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn’t create the category. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteCategory(deleteTarget.id);
      if (result.success) {
        toast.success("Category deleted");
        setDeleteTarget(null);
        router.refresh();
        fetchStats(activeRange.start, activeRange.end);
      } else {
        toast.error(result.error);
        setDeleteTarget(null);
        router.refresh();
      }
    } catch {
      toast.error("Couldn’t delete the category. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE_META["/categories"].title}
        subtitle={PAGE_META["/categories"].subtitle}
        className="mb-0"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-panel p-4">
          <p className="text-muted-foreground text-sm font-medium">
            Total expenses
          </p>
          <MoneyAmount
            amount={stats.expenseTotal}
            size="lg"
            tone="expense"
            className="mt-1"
          />
        </div>
        <div className="surface-panel p-4">
          <p className="text-muted-foreground text-sm font-medium">
            Total income
          </p>
          <MoneyAmount
            amount={stats.incomeTotal}
            size="lg"
            tone="income"
            className="mt-1"
          />
        </div>
        <div className="surface-panel p-4">
          <p className="text-muted-foreground text-sm font-medium">
            Active categories
          </p>
          <p className="tabular-money mt-1 text-2xl font-semibold">
            {activeCategories}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            of {categories.length} total
          </p>
        </div>
        <div className="surface-panel p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm font-medium">
              Top category
            </p>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: topCategory?.color ?? "#888" }}
              aria-hidden
            />
          </div>
          <p className="mt-1 truncate text-lg font-semibold">
            {topCategory?.amount ? topCategory.categoryName : "—"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            {topCategory?.amount
              ? formatCurrency(topCategory.amount)
              : "No activity"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <p className="text-muted-foreground text-xs tabular-nums">
              {stats.transactionCount} transaction
              {stats.transactionCount === 1 ? "" : "s"} in period
            </p>
          </div>

          <Tabs
            value={filters.period}
            onValueChange={(v) => {
              if (!v) return;
              if (v === "custom") {
                const range = getDateRangeFromFilters(filters);
                updateFilters({
                  period: "custom",
                  dateFrom: range.start,
                  dateTo: range.end,
                });
                return;
              }
              updateFilters({ period: v as CategoryPageFilters["period"] });
            }}
          >
            <TabsList className="h-auto w-full flex-wrap">
              <TabsTrigger value="week" className="flex-1">
                This Week
              </TabsTrigger>
              <TabsTrigger value="month" className="flex-1">
                This Month
              </TabsTrigger>
              <TabsTrigger value="lastMonth" className="flex-1">
                Last Month
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex-1">
                Custom
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filters.period === "custom" && (
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="space-y-1.5">
                <Label
                  htmlFor="cat-date-from"
                  className="text-muted-foreground text-xs"
                >
                  From
                </Label>
                <Input
                  id="cat-date-from"
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo || toISODate()}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="cat-date-to"
                  className="text-muted-foreground text-xs"
                >
                  To
                </Label>
                <Input
                  id="cat-date-to"
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom}
                  max={toISODate()}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="cat-search"
                className="text-muted-foreground text-xs"
              >
                Search
              </Label>
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="cat-search"
                  type="search"
                  placeholder="Category name..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Sort by</Label>
              <Select
                value={filters.sort}
                onValueChange={(v) =>
                  v && updateFilters({ sort: v as CategoryPageFilters["sort"] })
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Amount (high)</SelectItem>
                  <SelectItem value="count">Transactions</SelectItem>
                  <SelectItem value="name">Name (A–Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant={filters.hideEmpty ? "secondary" : "outline"}
                size="sm"
                className="h-8 flex-1"
                onClick={() => updateFilters({ hideEmpty: !filters.hideEmpty })}
              >
                {filters.hideEmpty ? "Showing active" : "Hide empty"}
              </Button>
              {showClearFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() =>
                    updateFilters({ search: "", hideEmpty: false })
                  }
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center">
          <Tabs
            value={filters.type}
            onValueChange={(v) =>
              v && handleReportTypeChange(v as CategoryType)
            }
          >
            <TabsList className="h-9">
              <TabsTrigger value="expense" className="min-w-24">
                Expense
              </TabsTrigger>
              <TabsTrigger value="income" className="min-w-24">
                Income
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="space-y-4">
                  <Skeleton className="mx-auto h-44 w-44 rounded-full" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  No {filters.type} activity in this period.
                </p>
              ) : (
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <DonutChart data={chartData} total={chartTotal} />
                  <div className="min-w-0 flex-1 space-y-2">
                    {chartData.map((item) => (
                      <CategoryBar
                        key={item.categoryId}
                        item={item}
                        maxAmount={maxChartAmount}
                        selected={selectedId === item.categoryId}
                        onSelect={() => selectCategory(item.categoryId)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Category Report</CardTitle>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger render={<Button size="sm" variant="outline" />}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Category</DialogTitle>
                  </DialogHeader>
                  <CategoryForm
                    onSubmit={handleCreate}
                    onCancel={() => setCreateOpen(false)}
                    loading={creating}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  No categories match your filters.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Txns</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((row) => {
                      // Only unused custom categories can be deleted. If usage
                      // couldn't be checked, hide delete to be safe.
                      const canDelete =
                        !row.isSystem &&
                        !row.categoryId.startsWith("uncategorized") &&
                        usedIds !== null &&
                        !usedIds.has(row.categoryId);
                      const categoryMeta = categories.find(
                        (c) => c.id === row.categoryId
                      );

                      return (
                        <TableRow
                          key={row.categoryId}
                          data-state={
                            selectedId === row.categoryId
                              ? "selected"
                              : undefined
                          }
                          className="cursor-pointer"
                          onClick={() => selectCategory(row.categoryId)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: row.color }}
                              />
                              <span className="font-medium">
                                {row.categoryName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.transactionCount}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(row.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-right tabular-nums">
                            {row.amount > 0
                              ? `${row.percentOfTypeTotal.toFixed(1)}%`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {canDelete &&
                            categoryMeta &&
                            !categoryMeta.is_system ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                aria-label={`Delete ${row.categoryName}`}
                                title="Delete category"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({
                                    id: row.categoryId,
                                    name: row.categoryName,
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title={`Delete “${deleteTarget?.name ?? ""}”?`}
        description="This category isn’t used by any transactions. It will be permanently removed."
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />

      <CategoryTransactionsSheet
        open={!!selectedCategory}
        onOpenChange={(open) => !open && setSelectedId(null)}
        categoryId={selectedCategory?.categoryId ?? null}
        categoryName={selectedCategory?.categoryName ?? ""}
        categoryColor={selectedCategory?.color ?? "#888888"}
        categoryType={selectedCategory?.type ?? filters.type}
        start={activeRange.start}
        end={activeRange.end}
        typeFilter={filters.type}
      />
    </div>
  );
}
