"use client";

import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useTransactionDialog } from "@/components/providers/transaction-dialog-provider";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/accounts": "Accounts",
  "/recurring": "Recurring",
};

export function Header() {
  const pathname = usePathname();
  const { setOpen } = useTransactionDialog();
  const title = PAGE_TITLES[pathname] ?? "KharchaBook";

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4 lg:px-6">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>
    </header>
  );
}
