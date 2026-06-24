"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  ActionResult,
  Category,
  CategoryType,
  Transaction,
} from "@/lib/types";

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  color: string;
  type: CategoryType;
  isSystem: boolean;
  amount: number;
  transactionCount: number;
  percentOfTypeTotal: number;
}

export interface CategoryStatsSummary {
  categories: CategoryStats[];
  expenseTotal: number;
  incomeTotal: number;
  transactionCount: number;
}

function revalidateCategoryPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/categories");
}

export async function getCategories(): Promise<ActionResult<Category[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Category[] };
}

export async function getCategoryStats(
  start: string,
  end: string,
  type: CategoryType | "all" = "all"
): Promise<ActionResult<CategoryStatsSummary>> {
  const supabase = await createClient();

  let categoriesQuery = supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (type !== "all") {
    categoriesQuery = categoriesQuery.eq("type", type);
  }

  let txnQuery = supabase
    .from("transactions")
    .select("amount, type, category_id")
    .in("type", ["income", "expense"])
    .gte("date", start)
    .lte("date", end);

  if (type !== "all") {
    txnQuery = txnQuery.eq("type", type);
  }

  const [categoriesRes, txnRes] = await Promise.all([
    categoriesQuery,
    txnQuery,
  ]);

  if (categoriesRes.error) {
    return { success: false, error: categoriesRes.error.message };
  }
  if (txnRes.error) {
    return { success: false, error: txnRes.error.message };
  }

  const categories = (categoriesRes.data ?? []) as Category[];
  const txns = txnRes.data ?? [];

  const aggregates = new Map<
    string,
    { amount: number; transactionCount: number; type: CategoryType }
  >();
  let expenseTotal = 0;
  let incomeTotal = 0;

  for (const txn of txns) {
    const txnType = txn.type as CategoryType;
    const amount = Number(txn.amount);
    if (txnType === "expense") expenseTotal += amount;
    else incomeTotal += amount;

    const categoryId = txn.category_id ?? `uncategorized-${txnType}`;
    const existing = aggregates.get(categoryId);
    if (existing) {
      existing.amount += amount;
      existing.transactionCount += 1;
    } else {
      aggregates.set(categoryId, {
        amount,
        transactionCount: 1,
        type: txnType,
      });
    }
  }

  const categoryStats: CategoryStats[] = categories.map((category) => {
    const stats = aggregates.get(category.id);
    const amount = stats?.amount ?? 0;
    const transactionCount = stats?.transactionCount ?? 0;
    const typeTotal = category.type === "expense" ? expenseTotal : incomeTotal;

    return {
      categoryId: category.id,
      categoryName: category.name,
      color: category.color ?? "#888888",
      type: category.type,
      isSystem: category.is_system,
      amount,
      transactionCount,
      percentOfTypeTotal: typeTotal > 0 ? (amount / typeTotal) * 100 : 0,
    };
  });

  for (const txnType of ["expense", "income"] as const) {
    const key = `uncategorized-${txnType}`;
    const uncategorized = aggregates.get(key);
    if (!uncategorized) continue;
    if (type !== "all" && type !== txnType) continue;

    const typeTotal = txnType === "expense" ? expenseTotal : incomeTotal;
    categoryStats.push({
      categoryId: key,
      categoryName: "Uncategorized",
      color: "#888888",
      type: txnType,
      isSystem: true,
      amount: uncategorized.amount,
      transactionCount: uncategorized.transactionCount,
      percentOfTypeTotal:
        typeTotal > 0 ? (uncategorized.amount / typeTotal) * 100 : 0,
    });
  }

  return {
    success: true,
    data: {
      categories: categoryStats,
      expenseTotal,
      incomeTotal,
      transactionCount: txns.length,
    },
  };
}

const TXN_SELECT =
  "*, account:accounts!transactions_account_id_fkey(*), category:categories(*), transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)";

export async function getCategoryTransactions(
  categoryId: string,
  start: string,
  end: string,
  type: CategoryType | "all" = "all"
): Promise<ActionResult<Transaction[]>> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(TXN_SELECT)
    .gte("date", start)
    .lte("date", end)
    .in("type", ["income", "expense"])
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (categoryId.startsWith("uncategorized-")) {
    const txnType = categoryId.replace("uncategorized-", "") as CategoryType;
    query = query.is("category_id", null).eq("type", txnType);
  } else {
    query = query.eq("category_id", categoryId);
  }

  if (type !== "all") {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  return { success: true, data: (data ?? []) as Transaction[] };
}

export async function createCategory(
  name: string,
  type: CategoryType,
  color: string | null
): Promise<ActionResult<Category>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name,
      type,
      color,
      is_system: false,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidateCategoryPaths();
  return { success: true, data: category as Category };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidateCategoryPaths();
  return { success: true, data: undefined };
}
