import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TransactionDialogProvider } from "@/components/providers/transaction-dialog-provider";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { createClient } from "@/utils/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email ?? null;

  return (
    <TransactionDialogProvider>
      <div className="app-atmosphere flex h-screen overflow-hidden">
        <Sidebar
          userEmail={userEmail}
          className="border-sidebar-border bg-sidebar/80 hidden w-[17.5rem] border-r backdrop-blur-xl lg:flex"
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header userEmail={userEmail} />
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
