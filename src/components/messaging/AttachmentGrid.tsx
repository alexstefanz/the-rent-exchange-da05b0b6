import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSignedChatMedia, type AttachmentRow } from "@/lib/chatMedia";

interface Props {
  attachments: AttachmentRow[];
  onOpen: (index: number) => void;
  className?: string;
}

export function AttachmentGrid({ attachments, onOpen, className }: Props) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        attachments.map(async (a) => {
          const path = a.kind === "video" && a.thumbnail_path ? a.thumbnail_path : a.storage_path;
          const url = await getSignedChatMedia(path, 3600);
          if (url) map[a.id] = url;
        })
      );
      if (!cancelled) setThumbs((prev) => ({ ...prev, ...map }));
    })();
    return () => {
      cancelled = true;
    };
  }, [attachments]);

  if (!attachments.length) return null;

  const count = attachments.length;
  const gridCols =
    count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className={cn("grid gap-1.5 mt-1", gridCols, className)}>
      {attachments.slice(0, 6).map((a, i) => {
        const url = thumbs[a.id];
        return (
          <button
            type="button"
            key={a.id}
            onClick={() => onOpen(i)}
            className={cn(
              "relative overflow-hidden rounded-xl bg-muted aspect-square group",
              count === 1 && "aspect-[4/3] max-w-[280px]"
            )}
          >
            {url ? (
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full animate-pulse bg-muted" />
            )}
            {a.kind === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-10 w-10 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}