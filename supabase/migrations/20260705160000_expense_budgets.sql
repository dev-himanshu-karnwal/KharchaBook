-- Expense budgets: monthly and custom date-range spending limits

CREATE TABLE public.expense_budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  period_type  TEXT NOT NULL CHECK (period_type IN ('monthly', 'custom')),
  name         TEXT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT expense_budgets_valid_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_expense_budgets_user_dates
  ON public.expense_budgets(user_id, start_date DESC, end_date DESC);

ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_expense_budgets"
  ON public.expense_budgets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "insert_own_expense_budgets"
  ON public.expense_budgets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_expense_budgets"
  ON public.expense_budgets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "delete_own_expense_budgets"
  ON public.expense_budgets FOR DELETE
  USING (user_id = auth.uid());

CREATE TRIGGER trg_expense_budgets_updated_at
  BEFORE UPDATE ON public.expense_budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
