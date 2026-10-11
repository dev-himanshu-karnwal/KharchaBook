"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { getBudgets } from "@/actions/budgets";
import type { Account, BudgetWithStatus, Category } from "@/lib/types";

export interface TransactionDialogData {
  accounts: Account[];
  categories: Category[];
  budgets: BudgetWithStatus[];
  /** True once accounts + categories have loaded at least once */
  ready: boolean;
  loading: boolean;
  error: string | null;
}

interface TransactionDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: TransactionDialogData;
  /** Fetch (or re-fetch) dialog data in the background. Safe to call often. */
  prefetch: () => void;
  /** Mark cached data stale so the next open/prefetch reloads it. */
  invalidate: () => void;
}

const EMPTY_DATA: TransactionDialogData = {
  accounts: [],
  categories: [],
  budgets: [],
  ready: false,
  loading: false,
  error: null,
};

const TransactionDialogContext = createContext<TransactionDialogContextType>({
  open: false,
  setOpen: () => {},
  data: EMPTY_DATA,
  prefetch: () => {},
  invalidate: () => {},
});

export function useTransactionDialog() {
  return useContext(TransactionDialogContext);
}

/** Avoid refetching on rapid hover → click sequences. */
const PREFETCH_FRESH_MS = 5_000;

export function TransactionDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpenState] = useState(false);
  const [data, setData] = useState<TransactionDialogData>(EMPTY_DATA);
  const inFlight = useRef(false);
  const lastFetchedAt = useRef(0);

  const prefetch = useCallback(() => {
    if (inFlight.current) return;
    if (Date.now() - lastFetchedAt.current < PREFETCH_FRESH_MS) return;

    inFlight.current = true;
    setData((prev) => ({ ...prev, loading: true, error: null }));

    const supabase = createClient();
    const accountsAndCategories = Promise.all([
      supabase.from("accounts").select("*").eq("is_active", true).order("name"),
      supabase.from("categories").select("*").order("sort_order"),
    ]).then(([accountsRes, categoriesRes]) => {
      const error =
        accountsRes.error?.message ?? categoriesRes.error?.message ?? null;
      setData((prev) => ({
        ...prev,
        accounts: accountsRes.error
          ? prev.accounts
          : ((accountsRes.data as Account[]) ?? []),
        categories: categoriesRes.error
          ? prev.categories
          : ((categoriesRes.data as Category[]) ?? []),
        ready: prev.ready || !error,
        error,
      }));
    });

    // Budgets only power the optional over-budget hint, so they never block
    // the form from rendering.
    const budgets = getBudgets().then((res) => {
      if (res.success) {
        setData((prev) => ({ ...prev, budgets: res.data }));
      }
    });

    Promise.allSettled([accountsAndCategories, budgets]).then((results) => {
      inFlight.current = false;
      lastFetchedAt.current = Date.now();
      const failed = results[0].status === "rejected";
      setData((prev) => ({
        ...prev,
        loading: false,
        error: failed ? "Couldn’t load your accounts" : prev.error,
      }));
    });
  }, []);

  const invalidate = useCallback(() => {
    lastFetchedAt.current = 0;
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      if (next) prefetch();
    },
    [prefetch]
  );

  const value = useMemo(
    () => ({ open, setOpen, data, prefetch, invalidate }),
    [open, setOpen, data, prefetch, invalidate]
  );

  return (
    <TransactionDialogContext.Provider value={value}>
      {children}
    </TransactionDialogContext.Provider>
  );
}
