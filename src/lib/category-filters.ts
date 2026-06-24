import type { CategoryType } from "@/lib/types";
import { getLastMonthRange, getMonthRange, getWeekRange } from "@/lib/utils";

export type CategoryPeriodPreset = "week" | "month" | "lastMonth" | "custom";
export type CategorySortField = "amount" | "name" | "count";

export interface CategoryPageFilters {
  period: CategoryPeriodPreset;
  dateFrom: string;
  dateTo: string;
  type: CategoryType;
  search: string;
  sort: CategorySortField;
  hideEmpty: boolean;
}

export const DEFAULT_CATEGORY_FILTERS: CategoryPageFilters = {
  period: "month",
  dateFrom: "",
  dateTo: "",
  type: "expense",
  search: "",
  sort: "amount",
  hideEmpty: false,
};

function getParam(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key);
  return value && value.length > 0 ? value : undefined;
}

export function parseCategoryFilters(
  params: URLSearchParams,
  fallbackRange?: { start: string; end: string }
): CategoryPageFilters {
  const periodParam = getParam(params, "period");
  const period: CategoryPeriodPreset =
    periodParam === "week" ||
    periodParam === "month" ||
    periodParam === "lastMonth" ||
    periodParam === "custom"
      ? periodParam
      : DEFAULT_CATEGORY_FILTERS.period;

  const typeParam = getParam(params, "type");
  const type: CategoryType =
    typeParam === "income" || typeParam === "expense"
      ? typeParam
      : DEFAULT_CATEGORY_FILTERS.type;

  const sortParam = getParam(params, "sort");
  const sort: CategorySortField =
    sortParam === "name" || sortParam === "count" || sortParam === "amount"
      ? sortParam
      : DEFAULT_CATEGORY_FILTERS.sort;

  const range = fallbackRange ?? getMonthRange();

  return {
    period,
    dateFrom: getParam(params, "dateFrom") ?? range.start,
    dateTo: getParam(params, "dateTo") ?? range.end,
    type,
    search: getParam(params, "search") ?? "",
    sort,
    hideEmpty: getParam(params, "hideEmpty") === "true",
  };
}

export function getDateRangeFromFilters(
  filters: CategoryPageFilters,
  fallbackRange?: { start: string; end: string }
): { start: string; end: string } {
  if (filters.period === "custom") {
    const fallback = fallbackRange ?? getMonthRange();
    const start = filters.dateFrom || fallback.start;
    const end = filters.dateTo || fallback.end;
    if (start && end && start <= end) {
      return { start, end };
    }
    return fallback;
  }

  switch (filters.period) {
    case "week":
      return getWeekRange();
    case "lastMonth":
      return getLastMonthRange();
    case "month":
    default:
      return getMonthRange();
  }
}

export function categoryFiltersToSearchParams(
  filters: CategoryPageFilters
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.period !== DEFAULT_CATEGORY_FILTERS.period) {
    params.set("period", filters.period);
  }

  if (filters.period === "custom") {
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
  }

  if (filters.type !== DEFAULT_CATEGORY_FILTERS.type) {
    params.set("type", filters.type);
  }

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.sort !== DEFAULT_CATEGORY_FILTERS.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.hideEmpty) {
    params.set("hideEmpty", "true");
  }

  return params;
}

export function hasActiveCategoryFilters(
  filters: CategoryPageFilters
): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.hideEmpty ||
    filters.period !== DEFAULT_CATEGORY_FILTERS.period ||
    filters.type !== DEFAULT_CATEGORY_FILTERS.type ||
    filters.sort !== DEFAULT_CATEGORY_FILTERS.sort
  );
}
