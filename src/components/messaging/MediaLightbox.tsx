import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSignedChatMedia, type AttachmentRow } from "@/lib/chatMedia";
import useEmblaCarousel from "embla-carousel-react";

interface Props {
  attachments: AttachmentRow[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}

export function MediaLightbox({ attachments, startIndex, open, onClose }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex, loop: false });
  const [index, setIndex] = useState(startIndex);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.scrollTo(startIndex, true);
    setIndex(startIndex);
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, startIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") emblaApi?.scrollPrev();
      if (e.key === "ArrowRight") emblaApi?.scrollNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, emblaApi, onClose]);

  // Resolve signed URLs for attachments around the current index
  useEffect(() => {
    if (!open) return;
    const toLoad = [index - 1, index, index + 1].filter((i) => i >= 0 && i < attachments.length);
    toLoad.forEach(async (i) => {
      const a = attachments[i];
      if (!a || urls[a.id]) return;
      const url = await getSignedChatMedia(a.storage_path);
      if (url) setUrls((prev) => ({ ...prev, [a.id]: url }));
    });
  }, [open, index, attachments, urls]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in">
      <div className="flex items-center justify-between p-3 text-white">
        <span className="text-sm">{index + 1} / {attachments.length}</span>
        <div className="flex items-center gap-1">
          {urls[attachments[index]?.id] && (
            <a href={urls[attachments[index].id]} download target="_blank" rel="noreferrer">
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                <Download className="h-5 w-5" />
              </Button>
            </a>
          )}
          <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative" ref={emblaRef}>
        <div className="flex h-full">
          {attachments.map((a) => {
            const url = urls[a.id];
            return (
              <div key={a.id} className="flex-[0_0_100%] h-full flex items-center justify-center px-2">
                {!url ? (
                  <div className="h-12 w-12 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : a.kind === "image" ? (
                  <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <video src={url} controls autoPlay className="max-h-full max-w-full" />
                )}
              </div>
            );
          })}
        </div>
        {index > 0 && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {index < attachments.length - 1 && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}