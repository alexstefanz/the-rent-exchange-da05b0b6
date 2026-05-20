import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CycleStep {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface Props {
  steps: CycleStep[];
}

/**
 * Scroll-driven zigzag timeline.
 * - Center spine fills with primary color as user scrolls through the section.
 * - Each text card slides in from its side with fade-in.
 * - Each icon + center dot turns solid primary (white icon) when the fill reaches it.
 */
export default function CycleTimeline({ steps }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 40%"],
  });
  const fillHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const { scrollYProgress: mobileProgress } = useScroll({
    target: mobileRef,
    offset: ["start 80%", "end 40%"],
  });
  const mobileFill = useTransform(mobileProgress, [0, 1], ["0%", "100%"]);

  return (
    <>
      {/* Desktop zigzag */}
      <div ref={containerRef} className="relative mx-auto hidden max-w-4xl md:block">
        {/* Spine background */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-primary/15"
        />
        {/* Spine fill */}
        <motion.div
          aria-hidden
          style={{ height: fillHeight }}
          className="pointer-events-none absolute left-1/2 top-0 w-0.5 -translate-x-1/2 bg-primary"
        />

        <div className="space-y-14">
          {steps.map((step, idx) => {
            const left = idx % 2 === 0;
            return (
              <DesktopRow
                key={idx}
                idx={idx}
                step={step}
                left={left}
                progress={scrollYProgress}
                threshold={(idx + 0.5) / steps.length}
                reduce={!!reduce}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile vertical */}
      <div ref={mobileRef} className="relative md:hidden">
        <div aria-hidden className="absolute left-5 top-2 h-[calc(100%-1rem)] w-px bg-primary/15" />
        <motion.div
          aria-hidden
          style={{ height: mobileFill }}
          className="absolute left-5 top-2 w-px bg-primary"
        />
        <div className="space-y-6">
          {steps.map((step, idx) => {
            return (
              <MobileRow
                key={idx}
                idx={idx}
                step={step}
                progress={mobileProgress}
                threshold={(idx + 0.5) / steps.length}
                reduce={!!reduce}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

function DesktopRow({
  idx,
  step,
  left,
  progress,
  threshold,
  reduce,
}: {
  idx: number;
  step: CycleStep;
  left: boolean;
  progress: MotionValue<number>;
  threshold: number;
  reduce: boolean;
}) {
  const Icon = step.icon;
  const active = useTransform(
    progress,
    [Math.max(0, threshold - 0.04), threshold],
    [0, 1]
  );
  const dotScale = useTransform(active, [0, 1], [1, 1.35]);
  const iconScale = useTransform(active, [0, 1], [1, 1.05]);
  const inactiveOpacity = useTransform(active, [0, 1], [1, 0]);

  return (
    <div className="relative grid grid-cols-[1fr_24px_1fr] items-center gap-6">
      {/* Center dot — lives in the middle 24px column so it always sits on the spine */}
      <div className="col-start-2 flex items-center justify-center">
        <motion.span
          aria-hidden
          style={{ scale: dotScale }}
          className="block h-3 w-3 rounded-full bg-primary ring-4 ring-background"
        />
      </div>

      {/* Text side — slides in from its side */}
      <motion.div
        initial={reduce ? false : { opacity: 0, x: left ? -40 : 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "row-start-1",
          left ? "col-start-1 text-right pr-2" : "col-start-3 text-left pl-2"
        )}
      >
        <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          {`PAS · ${String(idx + 1).padStart(2, "0")}`}
        </span>
        <h3 className="mt-3 font-heading text-xl font-semibold text-foreground">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
      </motion.div>

      {/* Icon side */}
      <div
        className={cn(
          "row-start-1",
          left ? "col-start-3 pl-2" : "col-start-1 pr-2"
        )}
      >
        <motion.div
          style={{ scale: iconScale }}
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-card transition-colors duration-500",
            left ? "" : "ml-auto"
          )}
        >
          {/* Filled overlay — opacity driven by scroll */}
          <motion.span
            aria-hidden
            style={{ opacity: active }}
            className="absolute inset-0 rounded-2xl bg-primary"
          />
          {/* Inactive icon */}
          <motion.span
            style={{ opacity: inactiveOpacity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon className="h-7 w-7 text-primary" />
          </motion.span>
          {/* Active icon (white) */}
          <motion.span
            style={{ opacity: active }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon className="h-7 w-7 text-primary-foreground" />
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

function MobileRow({
  idx,
  step,
  progress,
  threshold,
  reduce,
}: {
  idx: number;
  step: CycleStep;
  progress: MotionValue<number>;
  threshold: number;
  reduce: boolean;
}) {
  const Icon = step.icon;
  const active = useTransform(
    progress,
    [Math.max(0, threshold - 0.04), threshold],
    [0, 1]
  );
  const dotScale = useTransform(active, [0, 1], [1, 1.35]);
  const inactiveOpacity = useTransform(active, [0, 1], [1, 0]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative pl-14"
    >
      <motion.span
        aria-hidden
        style={{ scale: dotScale }}
        className="absolute left-5 top-5 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
      />
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="mb-2 flex items-center gap-3">
          <motion.div
            className={cn(
              "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 transition-colors duration-500"
            )}
          >
            <motion.span
              aria-hidden
              style={{ opacity: active }}
              className="absolute inset-0 bg-primary"
            />
            <motion.span
              style={{ opacity: inactiveOpacity }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Icon className="h-5 w-5 text-primary" />
            </motion.span>
            <motion.span
              style={{ opacity: active }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Icon className="h-5 w-5 text-primary-foreground" />
            </motion.span>
          </motion.div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {`PAS · ${String(idx + 1).padStart(2, "0")}`}
          </span>
        </div>
        <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
      </div>
    </motion.div>
  );
}