"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoanForm } from "./loan-form";
import { RepaymentForm } from "./repayment-form";
import {
  createLoan,
  createRepayment,
  deleteLoan,
  deleteRepayment,
} from "@/actions/loans";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Account, LoanSummary, PersonalLoan } from "@/lib/types";
import { toast } from "sonner";

function LoanCard({
  loan,
  accounts,
  onRefresh,
}: {
  loan: PersonalLoan;
  accounts: Account[];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const outstanding = loan.outstanding_amount ?? 0;
  const isSettled = outstanding <= 0;
  const repayments = loan.repayments ?? [];

  async function handleRepayment(data: Parameters<typeof createRepayment>[0]) {
    setLoading(true);
    const result = await createRepayment(data);
    setLoading(false);

    if (result.success) {
      toast.success("Repayment recorded");
      setRepayOpen(false);
      onRefresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDeleteLoan() {
    const result = await deleteLoan(loan.id);
    if (result.success) {
      toast.success("Loan deleted");
      onRefresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDeleteRepayment(id: string) {
    const result = await deleteRepayment(id);
    if (result.success) {
      toast.success("Repayment deleted");
      onRefresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card className={cn(isSettled && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{loan.person_name}</p>
              <Badge
                variant={loan.direction === "lent" ? "default" : "secondary"}
              >
                {loan.direction === "lent" ? "Lent" : "Borrowed"}
              </Badge>
              {isSettled && <Badge variant="outline">Settled</Badge>}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDate(loan.date)} · {loan.account?.name}
              {loan.description && <> · {loan.description}</>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(loan.amount)}
            </p>
            {!isSettled && (
              <p
                className={cn(
                  "text-xs font-medium tabular-nums",
                  loan.direction === "lent"
                    ? "text-emerald-400"
                    : "text-amber-400"
                )}
              >
                {formatCurrency(outstanding)} left
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {!isSettled && (
            <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" />}>
                Record Repayment
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Repayment</DialogTitle>
                </DialogHeader>
                <RepaymentForm
                  loan={loan}
                  accounts={accounts}
                  onSubmit={handleRepayment}
                  onCancel={() => setRepayOpen(false)}
                  loading={loading}
                />
              </DialogContent>
            </Dialog>
          )}
          {repayments.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              {repayments.length} repayment{repayments.length !== 1 ? "s" : ""}
              {expanded ? (
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground ml-auto"
            onClick={handleDeleteLoan}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {expanded && repayments.length > 0 && (
          <div className="mt-3 space-y-1 border-t pt-3">
            {repayments
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((r) => (
                <div
                  key={r.id}
                  className="group flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                >
                  <div>
                    <span className="tabular-nums">
                      {formatCurrency(r.amount)}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {formatDate(r.date)} · {r.account?.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteRepayment(r.id)}
                  >
                    <Trash2 className="text-muted-foreground h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LoansClient({
  loans,
  accounts,
  summary,
}: {
  loans: PersonalLoan[];
  accounts: Account[];
  summary: LoanSummary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeLoans = loans.filter((l) => (l.outstanding_amount ?? 0) > 0);
  const settledLoans = loans.filter((l) => (l.outstanding_amount ?? 0) <= 0);

  async function handleCreate(data: Parameters<typeof createLoan>[0]) {
    setLoading(true);
    const result = await createLoan(data);
    setLoading(false);

    if (result.success) {
      toast.success("Loan recorded");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Owed to You</p>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">
              {formatCurrency(summary.owedToYou)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">You Owe</p>
            <p className="text-2xl font-bold text-amber-400 tabular-nums">
              {formatCurrency(summary.youOwe)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {activeLoans.length} active · {settledLoans.length} settled
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Loan
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Loan</DialogTitle>
            </DialogHeader>
            <LoanForm
              accounts={accounts}
              onSubmit={handleCreate}
              onCancel={() => setOpen(false)}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loans.length === 0 && (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No loans recorded yet. Track money lent to or borrowed from friends
          and family without counting it as expense or income.
        </p>
      )}

      {activeLoans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Active
          </h2>
          {activeLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              accounts={accounts}
              onRefresh={() => router.refresh()}
            />
          ))}
        </div>
      )}

      {settledLoans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Settled
          </h2>
          {settledLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              accounts={accounts}
              onRefresh={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
