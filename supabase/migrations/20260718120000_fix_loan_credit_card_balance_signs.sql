-- Correct personal loan balance deltas that were applied with asset cash-flow
-- signs on liability (credit card) accounts.
--
-- Bug: lending via credit card decreased outstanding instead of increasing it.
-- Old (wrong) liability deltas matched assets: lent -amount, borrowed +amount.
-- Correct liability deltas: lent +amount, borrowed -amount.
-- Correction per row = 2 × correct_delta.
--
-- Run once only. Do not re-run after new loans are created with the fixed app code.

DO $$
DECLARE
  r RECORD;
  correction NUMERIC(15, 2);
BEGIN
  FOR r IN
    SELECT pl.account_id, pl.direction, pl.amount::NUMERIC(15, 2) AS amount
    FROM public.personal_loans pl
    JOIN public.accounts a ON a.id = pl.account_id
    WHERE a.nature = 'liability'
  LOOP
    correction := CASE
      WHEN r.direction = 'lent' THEN 2 * r.amount
      ELSE -2 * r.amount
    END;
    PERFORM public.adjust_account_balance(r.account_id, correction);
  END LOOP;

  FOR r IN
    SELECT lr.account_id, pl.direction, lr.amount::NUMERIC(15, 2) AS amount
    FROM public.loan_repayments lr
    JOIN public.personal_loans pl ON pl.id = lr.loan_id
    JOIN public.accounts a ON a.id = lr.account_id
    WHERE a.nature = 'liability'
  LOOP
    correction := CASE
      WHEN r.direction = 'lent' THEN -2 * r.amount
      ELSE 2 * r.amount
    END;
    PERFORM public.adjust_account_balance(r.account_id, correction);
  END LOOP;
END $$;
