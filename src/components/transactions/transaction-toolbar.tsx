"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_ACTIVITY_FILTERS,
  type ActivityFilters,
  type ActivitySortField,
  type ActivitySortDir,
  type ActivityTypeFilter,
} from "@/lib/activity-feed";
import type { Account, Category } from "@/lib/types";

const TYPE_OPTIONS: { value: ActivityTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
  { value: "loan", label: "Loans" },
  { value: "loan_lent", label: "Loan · Lent" },
  { value: "loan_borrowed", label: "Loan · Borrowed" },
  { value: "loan_repayment", label: "Loan · Repayment" },
];

const SORT_OPTIONS: {
  value: `${ActivitySortField}-${ActivitySortDir}`;
  label: string;
  field: ActivitySortField;
  dir: ActivitySortDir;
}[] = [
  { value: "date-desc", label: "Date (newest)", field: "date", dir: "desc" },
  { value: "date-asc", label: "Date (oldest)", field: "date", dir: "asc" },
  {
    value: "amount-desc",
    label: "Amount (high)",
    field: "amount",
    dir: "desc",
  },
  { value: "amount-asc", label: "Amount (low)", field: "amount", dir: "asc" },
];

interface TransactionToolbarProps {
  filters: ActivityFilters;
  onChange: (filters: ActivityFilters) => void;
  accounts: Account[];
  categories: Category[];
  totalCount: number;
  filteredCount: number;
}

function FilterField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "space-y-1.5"}>
      <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function TransactionToolbar({
  filters,
  onChange,
  accounts,
  categories,
  totalCount,
  filteredCount,
}: TransactionToolbarProps) {
  const sortValue = `${filters.sortField}-${filters.sortDir}`;
  const showClear =
    filters.search.trim() !== "" ||
    filters.type !== "all" ||
    filters.accountId !== "" ||
    filters.categoryId !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.sortField !== DEFAULT_ACTIVITY_FILTERS.sortField ||
    filters.sortDir !== DEFAULT_ACTIVITY_FILTERS.sortDir;

  function patch(partial: Partial<ActivityFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FilterField
          label="Search"
          htmlFor="txn-search"
          className="min-w-0 flex-1 space-y-1.5"
        >
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              id="txn-search"
              type="search"
              placeholder="Description, person, account..."
              value={filters.search}
              onChange={(e) => patch({ search: e.target.value })}
              className="pl-8"
            />
          </div>
        </FilterField>
        <p className="text-muted-foreground shrink-0 pb-2 text-xs tabular-nums">
          {filteredCount === totalCount
            ? `${totalCount} item${totalCount === 1 ? "" : "s"}`
            : `${filteredCount} of ${totalCount}`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <FilterField label="Type">
          <Select
            value={filters.type}
            onValueChange={(v) => v && patch({ type: v as ActivityTypeFilter })}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Account">
          <Select
            value={filters.accountId || "all"}
            onValueChange={(v) =>
              patch({ accountId: v === "all" ? "" : (v ?? "") })
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Category">
          <Select
            value={filters.categoryId || "all"}
            onValueChange={(v) =>
              patch({ categoryId: v === "all" ? "" : (v ?? "") })
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Sort by">
          <Select
            value={sortValue}
            onValueChange={(v) => {
              const option = SORT_OPTIONS.find((o) => o.value === v);
              if (option)
                patch({ sortField: option.field, sortDir: option.dir });
            }}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="From" htmlFor="txn-date-from">
          <Input
            id="txn-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => patch({ dateFrom: e.target.value })}
            className="w-full"
          />
        </FilterField>

        <FilterField label="To" htmlFor="txn-date-to">
          <Input
            id="txn-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => patch({ dateTo: e.target.value })}
            className="w-full"
          />
        </FilterField>

        {showClear && (
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1"
              onClick={() => onChange(DEFAULT_ACTIVITY_FILTERS)}
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
