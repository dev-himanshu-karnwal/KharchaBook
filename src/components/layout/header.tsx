"use client";

import { useState } from "react";
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
import { PAGE_META } from "@/lib/nav";

export function Header() {
  const pathname = usePathname();
  const { setOpen } = useTransactionDialog();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = PAGE_META[pathname] ?? {
    title: "KharchaBook",
    showAddTransaction: false,
  };

  return (
    <header className="border-border/70 bg-background/70 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-xl lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1 lg:hidden">
        <p className="truncate text-sm font-semibold tracking-tight">
          {meta.title}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {meta.showAddTransaction && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Add transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>
    </header>
  );
}
