export function NotificationSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border/50">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="h-2.5 w-20 rounded bg-muted/70 animate-pulse" />
            <div className="h-2.5 w-3/4 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
