import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  title?: string;
}

const PremiumLightbox = ({ open, images, index, onClose, onIndexChange, title }: Props) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  useEffect(() => { reset(); }, [index, reset]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      else if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
      else if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.25, 4));
      else if (e.key === "-") setZoom(z => Math.max(z - 0.25, 1));
      else if (e.key === "0") reset();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [open, index, images.length, onClose, onIndexChange, reset]);

  if (!open) return null;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z + (e.deltaY < 0 ? 0.15 : -0.15), 1), 4));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.px + (e.clientX - dragRef.current.x), y: dragRef.current.py + (e.clientY - dragRef.current.y) });
  };
  const handleMouseUp = () => { dragRef.current = null; };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 text-white shrink-0">
        <div className="text-sm font-medium tabular-nums">{index + 1} / {images.length}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(z - 0.25, 1))} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="zoom out"><ZoomOut className="h-5 w-5" /></button>
          <span className="text-xs tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="zoom in"><ZoomIn className="h-5 w-5" /></button>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-2" aria-label="close"><X className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Image canvas */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center" onWheel={handleWheel}>
        {images.length > 1 && (
          <>
            <button onClick={() => onIndexChange((index - 1 + images.length) % images.length)} className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="previous"><ChevronLeft className="h-6 w-6" /></button>
            <button onClick={() => onIndexChange((index + 1) % images.length)} className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="next"><ChevronRight className="h-6 w-6" /></button>
          </>
        )}
        <img
          src={getOptimizedImageUrl(images[index], "gallery")}
          alt={`${title || "Image"} ${index + 1}`}
          draggable={false}
          className={cn("max-h-full max-w-full object-contain select-none transition-transform duration-150", zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onClick={() => zoom === 1 && setZoom(2)}
          onDoubleClick={reset}
        />
      </div>

      {/* Thumb strip */}
      {images.length > 1 && (
        <div className="shrink-0 px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 justify-center min-w-max mx-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => onIndexChange(i)}
                className={cn(
                  "h-16 w-20 rounded-lg overflow-hidden flex-shrink-0 transition-all",
                  i === index ? "ring-2 ring-primary scale-105" : "opacity-60 hover:opacity-100"
                )}
              >
                <img src={getOptimizedImageUrl(img, "thumb")} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumLightbox;