import type { Account } from "./types";
import { isCreditCard } from "./account-balance";

export interface CreditCardMetrics {
  outstanding: number;
  availableCredit: number | null;
  utilizationPercent: number | null;
}

export function computeCreditCardMetrics(
  account: Account
): CreditCardMetrics | null {
  if (!isCreditCard(account)) return null;

  const outstanding = Math.max(0, Number(account.balance));
  const creditLimit =
    account.credit_limit !== null ? Number(account.credit_limit) : null;

  const availableCredit =
    creditLimit !== null ? Math.max(0, creditLimit - outstanding) : null;

  const utilizationPercent =
    creditLimit !== null && creditLimit > 0
      ? (outstanding / creditLimit) * 100
      : null;

  return {
    outstanding,
    availableCredit,
    utilizationPercent,
  };
}

export type CreditCardWarningLevel = "high_utilization" | "over_limit";

export interface CreditCardWarning {
  level: CreditCardWarningLevel;
  message: string;
}

export function getCreditCardWarnings(account: Account): CreditCardWarning[] {
  const metrics = computeCreditCardMetrics(account);
  if (!metrics || metrics.utilizationPercent === null) return [];

  const warnings: CreditCardWarning[] = [];

  if (metrics.utilizationPercent > 100) {
    warnings.push({
      level: "over_limit",
      message: "Over credit limit",
    });
  } else if (metrics.utilizationPercent > 90) {
    warnings.push({
      level: "high_utilization",
      message: "High utilization (>90%)",
    });
  }

  return warnings;
}

export function formatDueDay(paymentDueDay: number | null): string | null {
  if (paymentDueDay === null) return null;

  const suffix =
    paymentDueDay >= 11 && paymentDueDay <= 13
      ? "th"
      : paymentDueDay % 10 === 1
        ? "st"
        : paymentDueDay % 10 === 2
          ? "nd"
          : paymentDueDay % 10 === 3
            ? "rd"
            : "th";

  return `Due every ${paymentDueDay}${suffix}`;
}

export function formatUtilization(
  utilizationPercent: number | null
): string | null {
  if (utilizationPercent === null) return null;
  return `${utilizationPercent.toFixed(2)}%`;
}

export function validateCreditCardInput(input: {
  credit_limit: number | null;
  payment_due_day: number | null;
  statement_day: number | null;
  card_last4: string | null;
  balance: number;
}): { ok: true } | { ok: false; error: string } {
  if (input.credit_limit !== null && input.credit_limit <= 0) {
    return { ok: false, error: "Credit limit must be positive" };
  }

  if (input.balance < 0) {
    return { ok: false, error: "Outstanding cannot be negative" };
  }

  if (
    input.payment_due_day !== null &&
    (input.payment_due_day < 1 || input.payment_due_day > 31)
  ) {
    return { ok: false, error: "Payment due day must be between 1 and 31" };
  }

  if (
    input.statement_day !== null &&
    (input.statement_day < 1 || input.statement_day > 31)
  ) {
    return { ok: false, error: "Statement day must be between 1 and 31" };
  }

  if (input.card_last4 !== null && !/^\d{4}$/.test(input.card_last4)) {
    return { ok: false, error: "Card last 4 digits must be exactly 4 numbers" };
  }

  return { ok: true };
}
