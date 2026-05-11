export function NotificationSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2 pt-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl">
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              <div className="h-3 w-12 rounded bg-muted/70 animate-pulse" />
            </div>
            <div className="h-3 w-3/4 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}