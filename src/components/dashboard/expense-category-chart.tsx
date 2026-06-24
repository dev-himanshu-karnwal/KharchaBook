"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  getExpensesByCategory,
  type CategoryExpense,
} from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  getLastMonthRange,
  getMonthRange,
  getWeekRange,
  toISODate,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

type DateRangePreset = "week" | "month" | "lastMonth" | "custom";

function getRangeForPreset(preset: DateRangePreset): {
  start: string;
  end: string;
} {
  switch (preset) {
    case "week":
      return getWeekRange();
    case "lastMonth":
      return getLastMonthRange();
    case "month":
    default:
      return getMonthRange();
  }
}

function CategoryBar({
  item,
  maxAmount,
}: {
  item: CategoryExpense;
  maxAmount: number;
}) {
  const width = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

  return (
    <div className="space-y-1.5">
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
          style={{
            width: `${width}%`,
            backgroundColor: item.color,
          }}
        />
      </div>
    </div>
  );
}

function DonutChart({
  data,
  total,
}: {
  data: CategoryExpense[];
  total: number;
}) {
  const size = 160;
  const strokeWidth = 28;
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

export function ExpenseCategoryChart({
  initialData,
  initialStart,
  initialEnd,
}: {
  initialData: CategoryExpense[];
  initialStart: string;
  initialEnd: string;
}) {
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [customStart, setCustomStart] = useState(initialStart);
  const [customEnd, setCustomEnd] = useState(initialEnd);
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);

  const fetchData = useCallback((start: string, end: string) => {
    startTransition(async () => {
      const result = await getExpensesByCategory(start, end);
      if (result.success) {
        setData(result.data);
      }
    });
  }, []);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    if (preset === "custom") {
      if (customStart && customEnd && customStart <= customEnd) {
        fetchData(customStart, customEnd);
      }
      return;
    }
    const { start, end } = getRangeForPreset(preset);
    fetchData(start, end);
  }, [preset, customStart, customEnd, fetchData]);

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const maxAmount = data[0]?.amount ?? 0;

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <CardTitle className="text-base">Expenses by Category</CardTitle>
        <Tabs
          value={preset}
          onValueChange={(v) => v && setPreset(v as DateRangePreset)}
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
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="chart-date-from"
                className="text-muted-foreground text-xs"
              >
                From
              </Label>
              <Input
                id="chart-date-from"
                type="date"
                value={customStart}
                max={customEnd || toISODate()}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="chart-date-to"
                className="text-muted-foreground text-xs"
              >
                To
              </Label>
              <Input
                id="chart-date-to"
                type="date"
                value={customEnd}
                min={customStart}
                max={toISODate()}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-4">
            <Skeleton className="mx-auto h-40 w-40 rounded-full" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No expenses in this period.
          </p>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <DonutChart data={data} total={total} />
            <div className={cn("min-w-0 flex-1 space-y-4")}>
              {data.map((item) => (
                <CategoryBar
                  key={item.categoryId}
                  item={item}
                  maxAmount={maxAmount}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
