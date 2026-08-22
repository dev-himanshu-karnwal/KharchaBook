import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TransactionDialogProvider } from "@/components/providers/transaction-dialog-provider";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionDialogProvider>
      <div className="app-atmosphere flex h-screen overflow-hidden">
        <Sidebar className="border-sidebar-border bg-sidebar/80 hidden w-[17.5rem] border-r backdrop-blur-xl lg:flex" />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="page-enter flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl p-4 pb-10 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <TransactionDialog />
    </TransactionDialogProvider>
  );
}
