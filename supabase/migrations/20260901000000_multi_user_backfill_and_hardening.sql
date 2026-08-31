-- Multi-user: backfill user_id, tighten RLS, lock down maintenance RPCs.
-- No public.users table — Supabase Auth (auth.users) is the source of truth.
--
-- Before running: confirm the owner in Authentication → Users
--   SELECT id, email, created_at FROM auth.users ORDER BY created_at;
--
-- Default: orphaned rows (NULL user_id) are assigned to the oldest auth user.
-- To target a specific user, set v_owner_id in the backfill block below.

-- ============================================
-- 1. Ensure user_id columns exist (no-op if already present)
-- ============================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.personal_loans
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.loan_repayments
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.expense_budgets
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- ============================================
-- 2. Backfill existing rows
-- ============================================

DO $$
DECLARE
  v_owner_id uuid := NULL; -- e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
BEGIN
  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION
      'No auth user found. Create a user in Authentication → Users, then re-run this migration.';
  END IF;

  RAISE NOTICE 'Assigning orphaned rows to user %', v_owner_id;

  UPDATE public.accounts
  SET user_id = v_owner_id
  WHERE user_id IS NULL;

  UPDATE public.transactions
  SET user_id = v_owner_id
  WHERE user_id IS NULL;

  UPDATE public.personal_loans
  SET user_id = v_owner_id
  WHERE user_id IS NULL;

  UPDATE public.loan_repayments
  SET user_id = v_owner_id
  WHERE user_id IS NULL;

  UPDATE public.expense_budgets
  SET user_id = v_owner_id
  WHERE user_id IS NULL;

  -- Shared system categories stay user_id NULL so every user can see them.
  UPDATE public.categories
  SET user_id = v_owner_id
  WHERE user_id IS NULL
    AND is_system = false;
END $$;

-- ============================================
-- 3. NOT NULL + foreign keys + indexes
-- ============================================

ALTER TABLE public.accounts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.personal_loans ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.loan_repayments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.expense_budgets ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounts_user_id_fkey'
  ) THEN
    ALTER TABLE public.accounts
      ADD CONSTRAINT accounts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_id_fkey'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'personal_loans_user_id_fkey'
  ) THEN
    ALTER TABLE public.personal_loans
      ADD CONSTRAINT personal_loans_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'loan_repayments_user_id_fkey'
  ) THEN
    ALTER TABLE public.loan_repayments
      ADD CONSTRAINT loan_repayments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expense_budgets_user_id_fkey'
  ) THEN
    ALTER TABLE public.expense_budgets
      ADD CONSTRAINT expense_budgets_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_loans_user ON public.personal_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_user ON public.loan_repayments(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_budgets_user_dates
  ON public.expense_budgets(user_id, start_date DESC, end_date DESC);

-- ============================================
-- 4. RLS: enable + policies scoped to authenticated
-- ============================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;

-- accounts
DROP POLICY IF EXISTS "select_own_accounts" ON public.accounts;
DROP POLICY IF EXISTS "insert_own_accounts" ON public.accounts;
DROP POLICY IF EXISTS "update_own_accounts" ON public.accounts;
DROP POLICY IF EXISTS "delete_own_accounts" ON public.accounts;

CREATE POLICY "select_own_accounts" ON public.accounts
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "insert_own_accounts" ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "update_own_accounts" ON public.accounts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "delete_own_accounts" ON public.accounts
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- transactions
DROP POLICY IF EXISTS "select_own_transactions" ON public.transactions;
DROP POLICY IF EXISTS "insert_own_transactions" ON public.transactions;
DROP POLICY IF EXISTS "update_own_transactions" ON public.transactions;
DROP POLICY IF EXISTS "delete_own_transactions" ON public.transactions;

CREATE POLICY "select_own_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "insert_own_transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "update_own_transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "delete_own_transactions" ON public.transactions
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- categories (system rows are shared; custom rows are per-user)
DROP POLICY IF EXISTS "select_system_and_own_categories" ON public.categories;
DROP POLICY IF EXISTS "insert_own_categories" ON public.categories;
DROP POLICY IF EXISTS "update_own_categories" ON public.categories;
DROP POLICY IF EXISTS "delete_own_categories" ON public.categories;

CREATE POLICY "select_system_and_own_categories" ON public.categories
  FOR SELECT TO authenticated
  USING (is_system = true OR user_id = (SELECT auth.uid()));
CREATE POLICY "insert_own_categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND is_system = false);
CREATE POLICY "update_own_categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND is_system = false)
  WITH CHECK (user_id = (SELECT auth.uid()) AND is_system = false);
CREATE POLICY "delete_own_categories" ON public.categories
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND is_system = false);

-- personal_loans
DROP POLICY IF EXISTS "select_own_personal_loans" ON public.personal_loans;
DROP POLICY IF EXISTS "insert_own_personal_loans" ON public.personal_loans;
DROP POLICY IF EXISTS "update_own_personal_loans" ON public.personal_loans;
DROP POLICY IF EXISTS "delete_own_personal_loans" ON public.personal_loans;

CREATE POLICY "select_own_personal_loans" ON public.personal_loans
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "insert_own_personal_loans" ON public.personal_loans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "update_own_personal_loans" ON public.personal_loans
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "delete_own_personal_loans" ON public.personal_loans
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- loan_repayments
DROP POLICY IF EXISTS "select_own_loan_repayments" ON public.loan_repayments;
DROP POLICY IF EXISTS "insert_own_loan_repayments" ON public.loan_repayments;
DROP POLICY IF EXISTS "update_own_loan_repayments" ON public.loan_repayments;
DROP POLICY IF EXISTS "delete_own_loan_repayments" ON public.loan_repayments;

CREATE POLICY "select_own_loan_repayments" ON public.loan_repayments
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "insert_own_loan_repayments" ON public.loan_repayments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "update_own_loan_repayments" ON public.loan_repayments
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "delete_own_loan_repayments" ON public.loan_repayments
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- expense_budgets
DROP POLICY IF EXISTS "select_own_expense_budgets" ON public.expense_budgets;
DROP POLICY IF EXISTS "insert_own_expense_budgets" ON public.expense_budgets;
DROP POLICY IF EXISTS "update_own_expense_budgets" ON public.expense_budgets;
DROP POLICY IF EXISTS "delete_own_expense_budgets" ON public.expense_budgets;

CREATE POLICY "select_own_expense_budgets" ON public.expense_budgets
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "insert_own_expense_budgets" ON public.expense_budgets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "update_own_expense_budgets" ON public.expense_budgets
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "delete_own_expense_budgets" ON public.expense_budgets
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- 5. Balance RPC: only the owner can adjust an account
--    (auth.uid() IS NULL keeps superuser/migration calls working)
-- ============================================

CREATE OR REPLACE FUNCTION public.adjust_account_balance(
  p_account_id UUID,
  p_delta NUMERIC(15, 2)
)
RETURNS NUMERIC(15, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance NUMERIC(15, 2);
  account_nature TEXT;
  new_balance NUMERIC(15, 2);
BEGIN
  SELECT balance, nature
  INTO current_balance, account_nature
  FROM public.accounts
  WHERE id = p_account_id
    AND (
      (SELECT auth.uid()) IS NULL
      OR user_id = (SELECT auth.uid())
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  new_balance := current_balance + p_delta;

  IF account_nature = 'liability' AND new_balance < 0 THEN
    RAISE EXCEPTION 'Outstanding cannot become negative';
  END IF;

  UPDATE public.accounts
  SET balance = new_balance,
      updated_at = now()
  WHERE id = p_account_id;

  RETURN new_balance;
END;
$$;

-- ============================================
-- 6. Category maintenance RPCs: service_role only
--    These are SECURITY DEFINER and must not be callable by app users.
-- ============================================

REVOKE ALL ON FUNCTION public.list_categories_with_usage() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prune_unused_categories(boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_expense_categories(jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.list_categories_with_usage() TO service_role;
GRANT EXECUTE ON FUNCTION public.prune_unused_categories(boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_expense_categories(jsonb) TO service_role;
