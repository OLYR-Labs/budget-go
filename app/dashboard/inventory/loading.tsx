export default function InventoryLoading() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="mt-8 h-10 w-52 rounded bg-muted" />
        <div className="mt-2 h-4 w-80 rounded bg-muted" />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl border border-border bg-card" />
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-14 border-b border-border bg-muted/30" />
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid min-w-[850px] grid-cols-5 gap-6 px-5 py-5">
                <div className="h-10 rounded bg-muted" />
                <div className="h-5 rounded bg-muted" />
                <div className="h-5 rounded bg-muted" />
                <div className="h-5 rounded bg-muted" />
                <div className="h-5 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
