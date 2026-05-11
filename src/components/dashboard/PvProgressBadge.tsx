import { Camera, ListChecks, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUxCopy } from "@/hooks/useUxCopy";

export interface PvProgress {
  photos: number;
  photosRequired: number;
  checklistChecked: number;
  checklistTotal: number;
  selfSubmitted: boolean;
  otherSubmitted: boolean;
}

interface Props {
  progress: PvProgress;
  className?: string;
}

export default function PvProgressBadge({ progress, className }: Props) {
  const copy = useUxCopy();
  const t = copy.timeline.nextAction.pvProgress;

  const photosOk = progress.photos >= progress.photosRequired;
  const allDone = progress.selfSubmitted && progress.otherSubmitted;

  if (allDone) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200", className)}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t.complete}
      </div>
    );
  }

  if (progress.selfSubmitted && !progress.otherSubmitted) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700 border border-sky-200", className)}>
        <Clock className="h-3.5 w-3.5" />
        {t.waitingOther}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium border border-border/60", className)}>
      <span className={cn("inline-flex items-center gap-1", photosOk ? "text-emerald-700" : "text-foreground/70")}>
        <Camera className="h-3.5 w-3.5" />
        {t.photos(progress.photos, progress.photosRequired)}
      </span>
      <span className="opacity-30">·</span>
      <span className="inline-flex items-center gap-1 text-foreground/70">
        <ListChecks className="h-3.5 w-3.5" />
        {t.checklist(progress.checklistChecked, progress.checklistTotal)}
      </span>
    </div>
  );
}