-- KharchaBook Initial Schema
-- Tables: accounts, categories, recurring_transactions, transactions

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_account_balance(
  p_account_id UUID,
  p_delta NUMERIC(15,2)
)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance NUMERIC(15,2);
BEGIN
  UPDATE public.accounts
  SET balance = balance + p_delta,
      updated_at = now()
  WHERE id = p_account_id
  RETURNING balance INTO new_balance;

  RETURN new_balance;
END;
$$;

-- ============================================
-- ACCOUNTS
-- ============================================

CREATE TABLE public.accounts (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT            NOT NULL,
  type        TEXT            NOT NULL CHECK (type IN ('bank', 'cash', 'wallet', 'credit_card')),
  balance     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency    TEXT            NOT NULL DEFAULT 'INR',
  icon        TEXT,
  color       TEXT,
  is_active   BOOLEAN         NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_user ON public.accounts(user_id);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_accounts"  ON public.accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own_accounts" ON public.accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_accounts" ON public.accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own_accounts" ON public.accounts FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE public.categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  icon        TEXT,
  color       TEXT,
  is_system   BOOLEAN     NOT NULL DEFAULT false,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_user ON public.categories(user_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_system_and_own_categories"
  ON public.categories FOR SELECT
  USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "insert_own_categories"
  ON public.categories FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "update_own_categories"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid() AND is_system = false);

CREATE POLICY "delete_own_categories"
  ON public.categories FOR DELETE
  USING (user_id = auth.uid() AND is_system = false);

-- ============================================
-- RECURRING TRANSACTIONS
-- ============================================

CREATE TABLE public.recurring_transactions (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id      UUID            NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  category_id     UUID            REFERENCES public.categories(id) ON DELETE SET NULL,
  type            TEXT            NOT NULL CHECK (type IN ('income', 'expense')),
  name            TEXT            NOT NULL,
  amount          NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  frequency       TEXT            NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date      DATE            NOT NULL,
  end_date        DATE,
  next_due_date   DATE            NOT NULL,
  is_active       BOOLEAN         NOT NULL DEFAULT true,
  tag             TEXT            CHECK (tag IN ('emi', 'sip', 'subscription', 'salary', 'rent', 'insurance', 'other')),
  notes           TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_user ON public.recurring_transactions(user_id);
CREATE INDEX idx_recurring_due  ON public.recurring_transactions(user_id, next_due_date)
  WHERE is_active = true;

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_recurring" ON public.recurring_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own_recurring" ON public.recurring_transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_recurring" ON public.recurring_transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own_recurring" ON public.recurring_transactions FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_recurring_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- TRANSACTIONS
-- ============================================

CREATE TABLE public.transactions (
  id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id              UUID            NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  category_id             UUID            REFERENCES public.categories(id) ON DELETE SET NULL,
  type                    TEXT            NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount                  NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description             TEXT,
  date                    DATE            NOT NULL DEFAULT CURRENT_DATE,
  transfer_to_account_id  UUID            REFERENCES public.accounts(id),
  recurring_id            UUID            REFERENCES public.recurring_transactions(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_txn_user_date     ON public.transactions(user_id, date DESC);
CREATE INDEX idx_txn_user_account  ON public.transactions(user_id, account_id);
CREATE INDEX idx_txn_user_category ON public.transactions(user_id, category_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_transactions" ON public.transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own_transactions" ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_transactions" ON public.transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own_transactions" ON public.transactions FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- DEFAULT SYSTEM CATEGORIES
-- ============================================

INSERT INTO public.categories (name, type, icon, color, is_system, sort_order) VALUES
  -- Income
  ('Salary',        'income',  'banknote',       '#22c55e', true, 1),
  ('Freelance',     'income',  'laptop',         '#10b981', true, 2),
  ('Investment',    'income',  'trending-up',    '#06b6d4', true, 3),
  ('Business',      'income',  'briefcase',      '#8b5cf6', true, 4),
  ('Gift',          'income',  'gift',           '#f59e0b', true, 5),
  ('Refund',        'income',  'rotate-ccw',     '#64748b', true, 6),
  ('Other Income',  'income',  'plus-circle',    '#94a3b8', true, 7),
  -- Expense
  ('Food & Dining',    'expense', 'utensils',        '#ef4444', true, 1),
  ('Groceries',        'expense', 'shopping-cart',   '#f97316', true, 2),
  ('Transportation',   'expense', 'car',             '#eab308', true, 3),
  ('Shopping',         'expense', 'shopping-bag',    '#ec4899', true, 4),
  ('Bills & Utilities','expense', 'zap',             '#f59e0b', true, 5),
  ('Entertainment',    'expense', 'film',            '#a855f7', true, 6),
  ('Healthcare',       'expense', 'heart-pulse',     '#14b8a6', true, 7),
  ('Education',        'expense', 'graduation-cap',  '#3b82f6', true, 8),
  ('Rent',             'expense', 'home',            '#6366f1', true, 9),
  ('EMI',              'expense', 'calendar-clock',  '#dc2626', true, 10),
  ('Insurance',        'expense', 'shield',          '#0ea5e9', true, 11),
  ('Subscriptions',    'expense', 'repeat',          '#d946ef', true, 12),
  ('Personal Care',    'expense', 'smile',           '#fb923c', true, 13),
  ('Investment',       'expense', 'trending-up',     '#0d9488', true, 14),
  ('Other Expense',    'expense', 'minus-circle',    '#94a3b8', true, 15);
