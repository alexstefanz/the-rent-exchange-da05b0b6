import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, ZoomIn, ZoomOut, Camera } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File) => Promise<void> | void;
  saving?: boolean;
}

/**
 * Premium avatar cropper. User loads an image, zooms with a slider,
 * pans by dragging, and we export a square JPEG (max 512px) ready for upload.
 */
export function AvatarCropperDialog({ file, open, onOpenChange, onConfirm, saving }: Props) {
  const { t } = useLanguage();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const FRAME = 280;

  useEffect(() => {
    if (!file) { setImgUrl(null); return; }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    });
  };
  const onPointerUp = () => { dragRef.current = null; };

  // Display fit: cover-fit base scale so zoom=1 fills the frame
  const baseScale = natural.w && natural.h ? Math.max(FRAME / natural.w, FRAME / natural.h) : 1;
  const displayW = natural.w * baseScale * zoom;
  const displayH = natural.h * baseScale * zoom;

  const handleConfirm = async () => {
    if (!imgRef.current || !file) return;
    // Map display crop back to source pixels.
    const scaleSrcPerDisplay = 1 / (baseScale * zoom);
    const sw = FRAME * scaleSrcPerDisplay;
    const sh = sw;
    const sx = (displayW / 2 - FRAME / 2 - offset.x) * scaleSrcPerDisplay;
    const sy = (displayH / 2 - FRAME / 2 - offset.y) * scaleSrcPerDisplay;

    const out = 512;
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      imgRef.current,
      Math.max(0, sx), Math.max(0, sy),
      Math.min(natural.w - Math.max(0, sx), sw),
      Math.min(natural.h - Math.max(0, sy), sh),
      0, 0, out, out
    );
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.88));
    if (!blob) return;
    const cropped = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    await onConfirm(cropped);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            {t("Decupează fotografia", "Crop your photo")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div
            className="relative overflow-hidden bg-muted rounded-full select-none touch-none"
            style={{ width: FRAME, height: FRAME, cursor: dragRef.current ? "grabbing" : "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {imgUrl && (
              <img
                ref={imgRef}
                src={imgUrl}
                onLoad={onLoad}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  width: displayW,
                  height: displayH,
                  left: FRAME / 2 - displayW / 2 + offset.x,
                  top: FRAME / 2 - displayH / 2 + offset.y,
                  maxWidth: "none",
                  pointerEvents: "none",
                }}
              />
            )}
            {/* Inner ring */}
            <div className="absolute inset-0 rounded-full ring-2 ring-primary/40 pointer-events-none" />
          </div>

          <div className="w-full flex items-center gap-3 px-2">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={(v) => setZoom(v[0])}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("Anulează", "Cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !imgUrl}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se salvează...", "Saving...")}</> : t("Salvează fotografia", "Save photo")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}