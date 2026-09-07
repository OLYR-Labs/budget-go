export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-8 text-zinc-950 dark:bg-[#08080b] dark:text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-white/[0.08]" />
        <div className="mt-8 h-10 w-72 rounded bg-zinc-200 dark:bg-white/[0.08]" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded bg-zinc-200 dark:bg-white/[0.08]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.07] dark:bg-[#101014]" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.07] dark:bg-[#101014]" />
          ))}
        </div>
        <div className="mt-6 h-80 rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.07] dark:bg-[#101014]" />
      </div>
    </main>
  );
}
