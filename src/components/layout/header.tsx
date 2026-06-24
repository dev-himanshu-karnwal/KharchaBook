"use client";

import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useTransactionDialog } from "@/components/providers/transaction-dialog-provider";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/loans": "Loans",
  "/accounts": "Accounts",
  "/categories": "Categories",
};

const SHOW_ADD_ON = new Set(["/", "/transactions"]);

export function Header() {
  const pathname = usePathname();
  const { setOpen } = useTransactionDialog();
  const title = PAGE_TITLES[pathname] ?? "KharchaBook";
  const showAdd = SHOW_ADD_ON.has(pathname);

  return (
    <header className="border-border bg-background/80 flex h-14 shrink-0 items-center gap-4 border-b px-4 backdrop-blur-sm lg:px-6">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

      {showAdd && (
        <div className="ml-auto">
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      )}
    </header>
  );
}
