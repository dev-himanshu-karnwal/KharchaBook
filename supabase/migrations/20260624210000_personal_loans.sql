-- Personal loans: short-term debt with friends/family (not expense/income)

CREATE TABLE public.personal_loans (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id  UUID            NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  person_name TEXT            NOT NULL,
  direction   TEXT            NOT NULL CHECK (direction IN ('lent', 'borrowed')),
  amount      NUMERIC(15, 2)  NOT NULL CHECK (amount > 0),
  date        DATE            NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_personal_loans_user ON public.personal_loans(user_id);
CREATE INDEX idx_personal_loans_user_date ON public.personal_loans(user_id, date DESC);

ALTER TABLE public.personal_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_personal_loans"
  ON public.personal_loans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own_personal_loans"
  ON public.personal_loans FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_personal_loans"
  ON public.personal_loans FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own_personal_loans"
  ON public.personal_loans FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_personal_loans_updated_at
  BEFORE UPDATE ON public.personal_loans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.loan_repayments (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id     UUID            NOT NULL REFERENCES public.personal_loans(id) ON DELETE CASCADE,
  account_id  UUID            NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  amount      NUMERIC(15, 2)  NOT NULL CHECK (amount > 0),
  date        DATE            NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_repayments_loan ON public.loan_repayments(loan_id);
CREATE INDEX idx_loan_repayments_user ON public.loan_repayments(user_id);

ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_loan_repayments"
  ON public.loan_repayments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own_loan_repayments"
  ON public.loan_repayments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_loan_repayments"
  ON public.loan_repayments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own_loan_repayments"
  ON public.loan_repayments FOR DELETE USING (user_id = auth.uid());
