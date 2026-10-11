"use client";

import { useEffect, useState } from "react";
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

export function Header({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const { open: dialogOpen, setOpen, prefetch } = useTransactionDialog();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = PAGE_META[pathname] ?? {
    title: "KharchaBook",
    showAddTransaction: false,
  };
  const canAdd = Boolean(meta.showAddTransaction);

  // Press "N" anywhere (outside of text fields) to add a transaction.
  useEffect(() => {
    if (!canAdd) return;
    function onKeyDown(e: KeyboardEvent) {
      if (dialogOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "n" && e.key !== "N") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.closest("[role=dialog]"))
      ) {
        return;
      }
      e.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canAdd, dialogOpen, setOpen]);

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
          <Sidebar
            userEmail={userEmail}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1 lg:hidden">
        <p className="truncate text-sm font-semibold tracking-tight">
          {meta.title}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {canAdd && (
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            onPointerEnter={prefetch}
            onFocus={prefetch}
            title="Add transaction (N)"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Add transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>
    </header>
  );
}
