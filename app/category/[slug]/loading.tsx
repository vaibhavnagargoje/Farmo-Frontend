export default function CategoryLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-background/95 pt-6 pb-4 px-4 lg:hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-full bg-muted animate-pulse"></div>
          <div className="flex-1">
            <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
            <div className="h-3 w-20 bg-muted rounded animate-pulse mt-1"></div>
          </div>
          <div className="size-10 rounded-full bg-muted animate-pulse"></div>
          <div className="size-10 rounded-full bg-muted animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-24 bg-muted rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Desktop Layout Skeleton */}
      <div className="hidden lg:flex max-w-7xl mx-auto w-full px-6 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-72 shrink-0">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="h-6 w-20 bg-muted rounded animate-pulse mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-muted rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-7 w-48 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-40 bg-muted rounded-xl animate-pulse"></div>
              <div className="h-10 w-20 bg-muted rounded-xl animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <div className="aspect-[16/10] bg-muted rounded-xl animate-pulse mb-4"></div>
                <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse mb-3"></div>
                <div className="h-10 bg-muted rounded-xl animate-pulse"></div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Mobile Content Skeleton */}
      <main className="flex-1 px-4 pt-2 lg:hidden">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-3 border border-border">
              <div className="aspect-[4/3] bg-muted rounded-xl animate-pulse mb-3"></div>
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
