"use server";

import { createClient } from "@/utils/supabase/server";
import type { ActionResult } from "@/lib/types";

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
}

export async function getExpensesByCategory(
  start: string,
  end: string
): Promise<ActionResult<CategoryExpense[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, category:categories(id, name, color)")
    .eq("type", "expense")
    .gte("date", start)
    .lte("date", end);

  if (error) {
    return { success: false, error: error.message };
  }

  const totals = new Map<string, CategoryExpense>();

  for (const txn of data ?? []) {
    const rawCategory = txn.category;
    const category = (
      Array.isArray(rawCategory) ? rawCategory[0] : rawCategory
    ) as {
      id: string;
      name: string;
      color: string | null;
    } | null;
    const categoryId = category?.id ?? "uncategorized";
    const existing = totals.get(categoryId);

    if (existing) {
      existing.amount += Number(txn.amount);
    } else {
      totals.set(categoryId, {
        categoryId,
        categoryName: category?.name ?? "Uncategorized",
        color: category?.color ?? "#888888",
        amount: Number(txn.amount),
      });
    }
  }

  const result = [...totals.values()].sort((a, b) => b.amount - a.amount);
  return { success: true, data: result };
}
