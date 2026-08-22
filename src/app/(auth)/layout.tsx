export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-atmosphere flex min-h-screen items-center justify-center px-4 py-10">
      <div className="page-enter w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
            Personal ledger
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            KharchaBook
          </h1>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
            Sign in to see balances, activity, and budgets — clearly and
            accurately.
          </p>
        </div>
        <div className="surface-panel p-6">{children}</div>
      </div>
    </div>
  );
}
