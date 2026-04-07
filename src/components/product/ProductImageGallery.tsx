import { useState, useEffect, useCallback } from "react";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ArrowLeft, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  title: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare?: () => void;
  onBack?: () => void;
  onOpenLightbox: (index: number) => void;
  variant: "mobile" | "desktop";
}

const ProductImageGallery = ({
  images,
  title,
  isFavorite,
  onToggleFavorite,
  onShare,
  onBack,
  onOpenLightbox,
  variant,
}: ProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDraggable = variant === "mobile";

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, watchDrag: isDraggable });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  if (variant === "mobile") {
    return (
      <div className="lg:hidden mt-16">
        <div className="relative overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {images.map((img, i) => (
              <div key={i} className="min-w-0 shrink-0 grow-0 basis-full">
                <img
                  src={img}
                  alt={`${title} ${i + 1}`}
                  className="w-full aspect-[4/3] object-cover bg-muted cursor-pointer"
                  onClick={() => onOpenLightbox(i)}
                  draggable={false}
                />
              </div>
            ))}
          </div>
          {onBack && (
            <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white z-10">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {onShare && (
            <button onClick={onShare} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white z-10">
              <Share2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={onToggleFavorite} className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
            <Heart className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
          </button>
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full z-10">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 px-[10px] mt-2 overflow-x-auto pb-2">
            {images.slice(1).map((image, index) => (
              <img key={index + 1} src={image} alt={`${title} ${index + 2}`} className="h-20 w-20 rounded-lg object-cover flex-shrink-0 cursor-pointer" onClick={() => onOpenLightbox(index + 1)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="relative overflow-hidden rounded-xl bg-muted hidden lg:block">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {images.map((img, i) => (
            <div key={i} className="min-w-0 shrink-0 grow-0 basis-full">
              <div className="aspect-[4/3] bg-muted cursor-pointer" onClick={() => onOpenLightbox(i)}>
                <img src={img} alt={`${title} ${i + 1}`} className="h-full w-full object-cover" draggable={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <>
          <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80" onClick={() => emblaApi?.scrollPrev()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80" onClick={() => emblaApi?.scrollNext()}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
      <button onClick={onToggleFavorite} className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <Heart className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
      </button>
    </div>
  );
};

export default ProductImageGallery;
