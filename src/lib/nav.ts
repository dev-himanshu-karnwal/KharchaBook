import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  HandCoins,
  CreditCard,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        href: "/",
        label: "Home",
        icon: LayoutDashboard,
        description: "Position & this month",
      },
      {
        href: "/transactions",
        label: "Activity",
        icon: ArrowLeftRight,
        description: "Ledger & history",
      },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      {
        href: "/accounts",
        label: "Accounts",
        icon: Wallet,
        description: "Bank, cash, wallets",
      },
      {
        href: "/credit-cards",
        label: "Credit cards",
        icon: CreditCard,
        description: "Outstanding & limits",
      },
      {
        href: "/loans",
        label: "Loans",
        icon: HandCoins,
        description: "Lent & borrowed",
      },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    items: [
      {
        href: "/budgets",
        label: "Budgets",
        icon: PiggyBank,
        description: "Spending limits",
      },
      {
        href: "/categories",
        label: "Categories",
        icon: Tags,
        description: "Income & expense labels",
      },
    ],
  },
];

export const PAGE_META: Record<
  string,
  { title: string; subtitle?: string; showAddTransaction?: boolean }
> = {
  "/": {
    title: "Home",
    subtitle: "Your financial position at a glance",
    showAddTransaction: true,
  },
  "/transactions": {
    title: "Activity",
    subtitle: "Every rupee movement in one ledger",
    showAddTransaction: true,
  },
  "/budgets": {
    title: "Budgets",
    subtitle: "Limits that keep spending intentional",
  },
  "/credit-cards": {
    title: "Credit cards",
    subtitle: "Outstanding balances and utilization",
  },
  "/loans": {
    title: "Loans",
    subtitle: "Money lent to and borrowed from people",
  },
  "/accounts": {
    title: "Accounts",
    subtitle: "Asset balances you can spend from",
  },
  "/categories": {
    title: "Categories",
    subtitle: "How income and expenses are classified",
  },
};

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
