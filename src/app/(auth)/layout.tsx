export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="page-enter w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">KharchaBook</h1>
          <p className="text-muted-foreground text-sm">
            Personal finance tracking for real life.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
