import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TransactionDialogProvider } from "@/components/providers/transaction-dialog-provider";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionDialogProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar className="border-border hidden w-64 border-r lg:flex" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="page-enter flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
      <TransactionDialog />
    </TransactionDialogProvider>
  );
}
