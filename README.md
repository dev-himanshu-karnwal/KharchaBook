# KharchaBook

Personal finance tracker for tracking income, expenses, accounts, credit cards, and personal loans. Built for INR-first budgeting with a clean dashboard and per-user data isolation via Supabase.

## Features

- **Dashboard** — Monthly income, expenses, net savings, net worth, expense breakdown by category, account balances, credit card utilization, loan summary, and recent activity
- **Transactions** — Record income, expenses, and transfers between accounts with categories, descriptions, and date filtering
- **Accounts** — Manage bank accounts, cash, and wallets with opening balances and color labels
- **Credit cards** — Track outstanding balance, credit limit, utilization, statement day, and payment due day
- **Loans** — Track money lent to or borrowed from people, record repayments, and write off unrecoverable amounts
- **Categories** — System and custom income/expense categories with icons and colors

## Tech stack

| Layer     | Tools                                                                           |
| --------- | ------------------------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/)  |
| Styling   | [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| Backend   | [Supabase](https://supabase.com/) (Postgres, Auth, Row Level Security)          |
| Language  | TypeScript                                                                      |
| Tooling   | ESLint, Prettier, Husky                                                         |

## Prerequisites

- Node.js ≥ 24
- pnpm ≥ 10
- A [Supabase](https://supabase.com/) project

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/dev-himanshu-karnwal/KharchaBook.git
cd KharchaBook
pnpm install
pnpm setup   # configure Husky git hooks
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Get these from **Supabase Dashboard → Project Settings → API**. Use the publishable (anon) key for the frontend — never expose the service role key in client code.

### 3. Database setup

Apply the SQL migrations in `supabase/migrations/` to your Supabase project, in filename order:

1. `20260513000000_initial_schema.sql`
2. `20260624000000_category_maintenance_rpcs.sql`
3. `20260624100000_add_expense_categories_rpc.sql`
4. `20260624200000_remove_recurring_transactions.sql`
5. `20260624210000_personal_loans.sql`
6. `20260705140000_loan_write_off.sql`
7. `20260705150000_credit_card_accounting.sql`

Run them via the Supabase CLI (`supabase db push`) or paste each file into **Supabase Dashboard → SQL Editor**.

### 4. Create a user

Sign-up is not exposed in the app. Create users from **Supabase Dashboard → Authentication → Users**.

### 5. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your Supabase user.

## Scripts

| Command                        | Description                     |
| ------------------------------ | ------------------------------- |
| `pnpm dev`                     | Start the development server    |
| `pnpm build`                   | Production build                |
| `pnpm start`                   | Start the production server     |
| `pnpm lint`                    | Run ESLint                      |
| `pnpm format`                  | Format with Prettier            |
| `pnpm categories:list`         | List categories in the database |
| `pnpm categories:add-expense`  | Seed default expense categories |
| `pnpm categories:prune-unused` | Remove unused custom categories |

Category maintenance scripts read from `.env.local` (see `scripts/lib/supabase-env.mjs`).

## Project structure

```
src/
├── actions/          # Server actions (accounts, transactions, loans, etc.)
├── app/
│   ├── (app)/        # Authenticated routes (dashboard, transactions, …)
│   └── (auth)/       # Login
├── components/       # UI components by feature
├── lib/              # Types, utilities, domain logic
└── utils/supabase/   # Supabase client helpers (browser, server, middleware)

supabase/migrations/  # Postgres schema and RPC migrations
scripts/              # Category maintenance CLI tools
```
