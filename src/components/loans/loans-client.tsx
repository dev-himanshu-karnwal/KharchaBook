"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  writeOffLoan,
  undoWriteOffLoan,
} from "@/actions/loans";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { loanWriteOffLabel } from "@/lib/activity-feed";
import type { Account, LoanSummary, PersonalLoan } from "@/lib/types";
import { toast } from "sonner";
import { runAction } from "@/lib/run-action";
import { PageHeader } from "@/components/v2/page-header";
import { MoneyAmount } from "@/components/v2/money-amount";
import { PAGE_META } from "@/lib/nav";

type DeleteTarget =
  | { type: "loan"; id: string; name: string }
  | { type: "repayment"; id: string };

type WriteOffTarget = {
  id: string;
  name: string;
  direction: PersonalLoan["direction"];
  outstanding: number;
};

function LoanCard({
  loan,
  accounts,
  onRefresh,
  onDeleteLoan,
  onDeleteRepayment,
  onWriteOff,
  onUndoWriteOff,
}: {
  loan: PersonalLoan;
  accounts: Account[];
  onRefresh: () => void;
  onDeleteLoan: (id: string, name: string) => void;
  onDeleteRepayment: (id: string) => void;
  onWriteOff: (loan: PersonalLoan) => void;
  onUndoWriteOff: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const outstanding = loan.outstanding_amount ?? 0;
  const isSettled = outstanding <= 0 && !loan.is_written_off;
  const isWrittenOff = loan.is_written_off;
  const repayments = loan.repayments ?? [];

  async function handleRepayment(data: Parameters<typeof createRepayment>[0]) {
    setLoading(true);
    const result = await runAction(() => createRepayment(data));
    setLoading(false);

    if (result.success) {
      toast.success("Repayment recorded");
      setRepayOpen(false);
      onRefresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card
      className={cn(
        "hover:ring-foreground/20 transition-colors",
        isSettled && "opacity-60"
      )}
    >
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
              {isWrittenOff && (
                <Badge variant="destructive">
                  {loanWriteOffLabel(loan.direction)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDate(loan.date)} · {loan.account?.name}
              {loan.description && <> · {loan.description}</>}
              {isWrittenOff && loan.written_off_amount != null && (
                <> · {formatCurrency(loan.written_off_amount)} written off</>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(loan.amount)}
            </p>
            {!isSettled && !isWrittenOff && (
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!isSettled && !isWrittenOff && (
            <>
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
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => onWriteOff(loan)}
              >
                Mark {loanWriteOffLabel(loan.direction)}
              </Button>
            </>
          )}
          {isWrittenOff && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUndoWriteOff(loan.id)}
            >
              Restore Loan
            </Button>
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
            className="text-muted-foreground hover:text-destructive ml-auto"
            onClick={() => onDeleteLoan(loan.id, loan.person_name)}
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
                  className="hover:bg-muted/30 flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors"
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
                    className="text-muted-foreground hover:text-destructive h-7 w-7"
                    onClick={() => onDeleteRepayment(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [writeOffTarget, setWriteOffTarget] = useState<WriteOffTarget | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [writingOff, setWritingOff] = useState(false);

  const activeLoans = loans.filter(
    (l) => !l.is_written_off && (l.outstanding_amount ?? 0) > 0
  );
  const writtenOffLoans = loans.filter((l) => l.is_written_off);
  const settledLoans = loans.filter(
    (l) => !l.is_written_off && (l.outstanding_amount ?? 0) <= 0
  );

  async function handleCreate(data: Parameters<typeof createLoan>[0]) {
    setLoading(true);
    const result = await runAction(() => createLoan(data));
    setLoading(false);

    if (result.success) {
      toast.success("Loan recorded");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const result =
      deleteTarget.type === "loan"
        ? await runAction(() => deleteLoan(deleteTarget.id))
        : await runAction(() => deleteRepayment(deleteTarget.id));

    setDeleting(false);

    if (result.success) {
      toast.success(
        deleteTarget.type === "loan" ? "Loan deleted" : "Repayment deleted"
      );
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmWriteOff() {
    if (!writeOffTarget) return;
    setWritingOff(true);
    const result = await runAction(() => writeOffLoan(writeOffTarget.id));
    setWritingOff(false);

    if (result.success) {
      toast.success(`Marked as ${loanWriteOffLabel(writeOffTarget.direction)}`);
      setWriteOffTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleUndoWriteOff(id: string) {
    const result = await runAction(() => undoWriteOffLoan(id));
    if (result.success) {
      toast.success("Loan restored");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const deleteDescription =
    deleteTarget?.type === "loan"
      ? `The loan to ${deleteTarget.name} and all its repayments will be permanently removed.`
      : "This repayment will be permanently removed and the loan balance will be updated.";

  const writeOffDescription = writeOffTarget
    ? writeOffTarget.direction === "lent"
      ? `Mark ${writeOffTarget.name} as a bad debtor? The remaining ${formatCurrency(writeOffTarget.outstanding)} will no longer count as owed to you. Your account balance won't change — the money already left when you lent it.`
      : `Mark this as unrepayable? The remaining ${formatCurrency(writeOffTarget.outstanding)} you owe ${writeOffTarget.name} will be written off. Your account balance won't change — you keep the cash you already have.`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE_META["/loans"].title}
        subtitle={PAGE_META["/loans"].subtitle}
        className="mb-0"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add loan
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record loan</DialogTitle>
              </DialogHeader>
              <LoanForm
                accounts={accounts}
                onSubmit={handleCreate}
                onCancel={() => setOpen(false)}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="surface-panel p-4">
          <p className="text-muted-foreground text-sm">Owed to you</p>
          <MoneyAmount
            amount={summary.owedToYou}
            size="lg"
            tone="income"
            className="mt-1"
          />
        </div>
        <div className="surface-panel p-4">
          <p className="text-muted-foreground text-sm">You owe</p>
          <MoneyAmount
            amount={summary.youOwe}
            size="lg"
            tone="warning"
            className="mt-1"
          />
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        {activeLoans.length} active · {writtenOffLoans.length} written off ·{" "}
        {settledLoans.length} settled
      </p>

      <ConfirmDialog
        open={!!writeOffTarget}
        onOpenChange={(open) => !open && setWriteOffTarget(null)}
        title={`Mark as ${writeOffTarget ? loanWriteOffLabel(writeOffTarget.direction) : ""}?`}
        description={writeOffDescription}
        confirmLabel="Write Off"
        onConfirm={handleConfirmWriteOff}
        loading={writingOff}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this entry?"
        description={deleteDescription}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />

      {loans.length === 0 && (
        <EmptyState
          icon={HandCoins}
          title="No loans recorded"
          description="Track money lent to or borrowed from friends and family without counting it as expense or income."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add loan
            </Button>
          }
        />
      )}

      {activeLoans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
            Active
          </h2>
          {activeLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              accounts={accounts}
              onRefresh={() => router.refresh()}
              onDeleteLoan={(id, name) =>
                setDeleteTarget({ type: "loan", id, name })
              }
              onDeleteRepayment={(id) =>
                setDeleteTarget({ type: "repayment", id })
              }
              onWriteOff={(loan) =>
                setWriteOffTarget({
                  id: loan.id,
                  name: loan.person_name,
                  direction: loan.direction,
                  outstanding: loan.outstanding_amount ?? 0,
                })
              }
              onUndoWriteOff={handleUndoWriteOff}
            />
          ))}
        </div>
      )}

      {writtenOffLoans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
            Written Off
          </h2>
          {writtenOffLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              accounts={accounts}
              onRefresh={() => router.refresh()}
              onDeleteLoan={(id, name) =>
                setDeleteTarget({ type: "loan", id, name })
              }
              onDeleteRepayment={(id) =>
                setDeleteTarget({ type: "repayment", id })
              }
              onWriteOff={(loan) =>
                setWriteOffTarget({
                  id: loan.id,
                  name: loan.person_name,
                  direction: loan.direction,
                  outstanding: loan.outstanding_amount ?? 0,
                })
              }
              onUndoWriteOff={handleUndoWriteOff}
            />
          ))}
        </div>
      )}

      {settledLoans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
            Settled
          </h2>
          {settledLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              accounts={accounts}
              onRefresh={() => router.refresh()}
              onDeleteLoan={(id, name) =>
                setDeleteTarget({ type: "loan", id, name })
              }
              onDeleteRepayment={(id) =>
                setDeleteTarget({ type: "repayment", id })
              }
              onWriteOff={(loan) =>
                setWriteOffTarget({
                  id: loan.id,
                  name: loan.person_name,
                  direction: loan.direction,
                  outstanding: loan.outstanding_amount ?? 0,
                })
              }
              onUndoWriteOff={handleUndoWriteOff}
            />
          ))}
        </div>
      )}
    </div>
  );
}
