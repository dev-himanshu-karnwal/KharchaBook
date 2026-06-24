"use client";

import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  activityAmountColor,
  activityAmountPrefix,
  activityTypeLabel,
  type ActivityItem,
} from "@/lib/activity-feed";
import type { Transaction } from "@/lib/types";

interface ActivityRowProps {
  item: ActivityItem;
  signedAmount: number;
  onEdit?: (txn: Transaction) => void;
  onDelete?: (item: ActivityItem) => void;
  showDate?: boolean;
  compact?: boolean;
}

export function ActivityRow({
  item,
  signedAmount,
  onEdit,
  onDelete,
  showDate = false,
  compact = false,
}: ActivityRowProps) {
  const isLoan =
    item.displayType === "loan_lent" ||
    item.displayType === "loan_borrowed" ||
    item.displayType === "loan_repayment";

  const hasActions =
    onDelete || (onEdit && item.kind === "transaction" && item.transaction);

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 transition-colors",
        compact ? "py-2" : "hover:border-border hover:bg-muted/30 py-2.5"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "shrink-0 rounded-full",
            compact ? "h-2 w-2" : "h-2.5 w-2.5"
          )}
          style={{ backgroundColor: item.color }}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-medium",
                compact ? "truncate text-sm" : "text-sm"
              )}
            >
              {item.title}
            </p>
            {isLoan && (
              <Badge variant="outline" className="text-[10px] text-violet-400">
                {activityTypeLabel(item)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {showDate ? (
              <>
                {formatDate(item.date)}
                {item.subtitle && <> · {item.subtitle}</>}
              </>
            ) : (
              item.subtitle
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            activityAmountColor(item)
          )}
        >
          {activityAmountPrefix(item, signedAmount)}
          {formatCurrency(Math.abs(signedAmount))}
        </span>

        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                />
              }
            >
              <MoreHorizontal className="text-muted-foreground h-3.5 w-3.5" />
              <span className="sr-only">Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && item.kind === "transaction" && item.transaction && (
                <DropdownMenuItem onClick={() => onEdit(item.transaction!)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
