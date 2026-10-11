import {
  getCategories,
  getCategoryStats,
  getUsedCustomCategoryIds,
} from "@/actions/categories";
import { CategoriesClient } from "@/components/categories/categories-client";
import {
  getDateRangeFromFilters,
  parseCategoryFilters,
} from "@/lib/category-filters";
import { getMonthRange } from "@/lib/utils";
import type { Category } from "@/lib/types";
import { Suspense } from "react";
import { CategoriesSkeleton } from "@/components/v2/page-skeletons";

async function CategoriesContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }

  const defaultRange = getMonthRange();
  const filters = parseCategoryFilters(params, defaultRange);
  const { start, end } = getDateRangeFromFilters(filters, defaultRange);

  const [categoriesRes, statsRes, usedRes] = await Promise.all([
    getCategories(),
    getCategoryStats(start, end, "all"),
    getUsedCustomCategoryIds(),
  ]);

  const categories = categoriesRes.success ? categoriesRes.data : [];
  const stats = statsRes.success
    ? statsRes.data
    : {
        categories: [],
        expenseTotal: 0,
        incomeTotal: 0,
        transactionCount: 0,
      };

  return (
    <CategoriesClient
      categories={categories as Category[]}
      initialStats={stats}
      usedCategoryIds={usedRes.success ? usedRes.data : null}
    />
  );
}

export default function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent searchParams={searchParams} />
    </Suspense>
  );
}
