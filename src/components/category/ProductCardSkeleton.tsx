const ProductCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="overflow-hidden rounded-xl bg-card shadow-sm motion-safe:animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="aspect-[4/3] w-full bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:400px_100%] motion-safe:animate-shimmer-pass" />
    <div className="p-3 md:p-4 space-y-2">
      <div className="h-3 w-16 rounded-sm bg-muted" />
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="h-5 w-20 rounded bg-muted mt-2" />
    </div>
  </div>
);

export default ProductCardSkeleton;
