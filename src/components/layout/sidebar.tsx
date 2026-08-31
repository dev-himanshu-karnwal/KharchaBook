"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNavActive, NAV_GROUPS } from "@/lib/nav";

export function Sidebar({
  className,
  onNavigate,
  userEmail,
}: {
  className?: string;
  onNavigate?: () => void;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className={cn("flex h-full flex-col", className)}>
      <div className="border-sidebar-border flex h-16 items-center border-b px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="group flex min-w-0 flex-col"
        >
          <span className="font-heading text-lg font-semibold tracking-tight transition-opacity group-hover:opacity-80">
            KharchaBook
          </span>
          <span className="text-muted-foreground text-[10px] font-medium tracking-[0.16em] uppercase">
            Personal ledger
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="text-muted-foreground px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      active && "text-sidebar-primary"
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block leading-none font-medium">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-muted-foreground mt-1 block text-[11px] leading-snug">
                        {item.description}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-sidebar-border border-t p-3">
        {userEmail && (
          <p
            className="text-muted-foreground mb-2 truncate px-3 text-xs"
            title={userEmail}
          >
            {userEmail}
          </p>
        )}
        <Button
          variant="ghost"
          className="text-muted-foreground w-full justify-start gap-3"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
