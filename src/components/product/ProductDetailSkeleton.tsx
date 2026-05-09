import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="w-full max-w-7xl mx-auto py-6 px-[10px] md:px-6 lg:px-8">
      <Skeleton className="h-4 w-72 mb-4 hidden md:block" />
      <div className="hidden lg:flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      {/* Mobile gallery */}
      <div className="lg:hidden mt-16">
        <Skeleton className="w-full aspect-[4/3]" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] mt-4 lg:mt-0">
        <div className="space-y-5 order-2 lg:order-1">
          {/* Desktop cinematic gallery */}
          <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden h-[460px]">
            <Skeleton className="col-span-2 row-span-2 h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="order-1 lg:order-2 hidden lg:block">
          <div className="lg:sticky lg:top-24 space-y-3">
            <Skeleton className="h-[480px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default ProductDetailSkeleton;