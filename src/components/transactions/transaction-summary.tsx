"use client";

import { formatCurrency, cn } from "@/lib/utils";
import type { ActivitySummary } from "@/lib/activity-feed";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";

interface TransactionSummaryProps {
  summary: ActivitySummary;
  selectedCount?: number;
  totalCount?: number;
}

function SummaryStat({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-0.5">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p
        className={cn(
          "truncate text-base font-semibold tabular-nums sm:text-lg",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function TransactionSummary({
  summary,
  selectedCount = 0,
  totalCount,
}: TransactionSummaryProps) {
  const isSelection = selectedCount > 0;

  return (
    <div className="border-border space-y-3 border-t pt-4">
      {isSelection && totalCount != null && (
        <p className="text-muted-foreground text-xs tabular-nums">
          Summary for {selectedCount} selected{" "}
          {selectedCount === 1 ? "item" : "items"} of {totalCount}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Income"
          value={formatCurrency(summary.income)}
          icon={ArrowDownLeft}
          valueClassName="text-emerald-400"
        />
        <SummaryStat
          label="Expense"
          value={formatCurrency(summary.expense)}
          icon={ArrowUpRight}
          valueClassName="text-red-400"
        />
        <SummaryStat
          label="Transfers"
          value={formatCurrency(summary.transfer)}
          icon={ArrowLeftRight}
          valueClassName="text-blue-400"
        />
      </div>
    </div>
  );
}
