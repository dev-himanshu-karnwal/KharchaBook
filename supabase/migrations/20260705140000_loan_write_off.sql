-- Mark loans where remaining balance won't be recovered (lent) or repaid (borrowed)

ALTER TABLE public.personal_loans
  ADD COLUMN is_written_off      BOOLEAN         NOT NULL DEFAULT false,
  ADD COLUMN written_off_at      TIMESTAMPTZ,
  ADD COLUMN written_off_amount  NUMERIC(15, 2)  CHECK (written_off_amount IS NULL OR written_off_amount > 0);

ALTER TABLE public.personal_loans
  ADD CONSTRAINT personal_loans_written_off_consistency CHECK (
    (is_written_off = false AND written_off_at IS NULL AND written_off_amount IS NULL)
    OR
    (is_written_off = true AND written_off_at IS NOT NULL AND written_off_amount IS NOT NULL)
  );
