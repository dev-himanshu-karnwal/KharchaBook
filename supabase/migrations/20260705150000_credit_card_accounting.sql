-- Credit card accounting: liability nature, extended fields, balance semantics

ALTER TABLE public.accounts
  ADD COLUMN nature TEXT NOT NULL DEFAULT 'asset'
    CHECK (nature IN ('asset', 'liability')),
  ADD COLUMN credit_limit NUMERIC(15, 2),
  ADD COLUMN payment_due_day INTEGER
    CHECK (payment_due_day IS NULL OR (payment_due_day >= 1 AND payment_due_day <= 31)),
  ADD COLUMN statement_day INTEGER
    CHECK (statement_day IS NULL OR (statement_day >= 1 AND statement_day <= 31)),
  ADD COLUMN card_last4 TEXT
    CHECK (card_last4 IS NULL OR (length(card_last4) = 4 AND card_last4 ~ '^[0-9]+$'));

-- Existing credit cards are liabilities; all other accounts remain assets
UPDATE public.accounts
SET nature = 'liability'
WHERE type = 'credit_card';

-- Legacy credit card balances used asset semantics (expenses decreased balance).
-- Convert negative balances to positive outstanding debt.
UPDATE public.accounts
SET balance = ABS(balance)
WHERE type = 'credit_card' AND balance < 0;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_type_nature_sync CHECK (
    (type = 'credit_card' AND nature = 'liability')
    OR (type <> 'credit_card' AND nature = 'asset')
  ),
  ADD CONSTRAINT accounts_liability_balance_nonneg CHECK (
    nature = 'asset' OR balance >= 0
  ),
  ADD CONSTRAINT accounts_credit_limit_positive CHECK (
    credit_limit IS NULL OR credit_limit > 0
  );

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
