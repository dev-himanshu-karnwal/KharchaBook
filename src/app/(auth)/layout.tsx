export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">KharchaBook</h1>
          <p className="text-sm text-muted-foreground">
            Personal finance tracking for real life.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
