import React, { useEffect } from "react";
import type { IntroSlide } from "@/lib/game/ui/intro/introSlides";

export interface IntroSequencePanelProps {
  slides: IntroSlide[];
  index: number;
  onNext: () => void;
  onSkip: () => void;
}

export default function IntroSequencePanel({ slides, index, onNext, onSkip }: IntroSequencePanelProps) {
  const slide = slides[index];

  useEffect(() => {
    // trigger line fade-in stagger using CSS classes
    const timerIds: number[] = [];
    const nodes = Array.from(document.querySelectorAll("[data-intro-line]"));
    nodes.forEach((el, i) => {
      const t = window.setTimeout(() => {
        (el as HTMLElement).classList.remove("opacity-0", "translate-y-1");
        (el as HTMLElement).classList.add("opacity-100", "translate-y-0");
      }, 120 * i + 140);
      timerIds.push(t);
    });
    return () => {
      timerIds.forEach(clearTimeout);
    };
  }, [index]);

  // Derive optional image sizing from slide
  const sizeMapSingle: Record<string, number> = { sm: 140, md: 160, lg: 190, xl: 220 };
  const sizeMapGrid: Record<string, number> = { sm: 84, md: 110, lg: 140, xl: 220 };
  const imgSizeKey = (slide as any).imgSize as string | undefined;
  const singleSize = sizeMapSingle[imgSizeKey ?? "md"];
  const gridTile = sizeMapGrid[imgSizeKey ?? "md"];
  const imgsArr: string[] | undefined = (slide as any).imgs;
  const gridCols = imgsArr && imgsArr.length >= 3 ? 3 : 2;

  // Reserve consistent aside width so all slides have the same overall shape
  const estimatedGridW = gridTile * gridCols + 16 * (gridCols - 1) + 24; // cols + gaps + padding
  const estimatedSingleW = singleSize + 32;      // p-2 (16*2)
  const asideWidth = Math.max(estimatedGridW, estimatedSingleW, 420);

  return (
    <div className="w-full max-w-[900px] max-h-[680px] min-h-[480px] text-slate-200 p-7 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md bg-[linear-gradient(180deg,rgba(11,18,32,0.96),rgba(8,13,24,0.96))] animate-[sap-pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both] flex flex-col">
      <div className="flex items-start gap-5 flex-1">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold tracking-wider text-sky-300 uppercase mb-1.5">Climate Reality Simulation</div>
          <div className="text-[28px] font-black leading-tight text-slate-100 mb-3 [text-shadow:0_2px_0_rgba(0,0,0,.5)]">{slide.title}</div>

          <div className="flex flex-col gap-2 font-mono text-[16px] leading-snug text-slate-200/90">
            {slide.lines.map((l, i) => (
              <div key={i} data-intro-line className="sap-text-reveal" style={{ animationDelay: `${i * 140 + 120}ms` }}>{l}</div>
            ))}
          </div>

          {/* Fact + dots moved to a global centered row below */}
        </div>

        <div className="flex-shrink-0 self-start" style={{ width: `${asideWidth}px` }}>
          {(slide as any).imgs && Array.isArray((slide as any).imgs) && (slide as any).imgs.length > 0 ? (
            <div className={`grid ${gridCols === 3 ? "grid-cols-3" : "grid-cols-2"} gap-4 p-3 rounded-xl border border-slate-700/60 bg-slate-900/40`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {(slide as any).imgs.map((src: string, i: number) => (
                <img
                  key={i}
                  src={src}
                  alt={`${slide.title} ${i + 1}`}
                  style={{ width: `${gridTile}px`, height: `${gridTile}px` }}
                  className="object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,.45)]"
                />
              ))}
            </div>
          ) : slide.img ? (
            <div className="flex items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/40 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.img}
                alt={slide.title}
                style={{ width: `${singleSize}px`, height: `${singleSize}px` }}
                className="object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,.45)]"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Centered fact + progress dots (full width) */}
      <div className="mt-4 w-full flex flex-wrap items-center justify-center gap-3 text-[12px] text-slate-400 font-mono">
        {slide.fact && <div className="text-center">{slide.fact}</div>}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className={`w-[10px] h-[10px] rounded-full transition-colors ${i === index ? "bg-emerald-500" : "bg-slate-700"}`}/>
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-between gap-3">
        <button onClick={onSkip} className="px-4 py-2 bg-slate-800 text-slate-200 border border-slate-600 rounded-lg font-semibold font-mono hover:brightness-110 active:brightness-95">Skip</button>
        <button onClick={onNext} className="flex-1 px-6 py-3.5 rounded-xl font-extrabold font-mono tracking-wide text-emerald-950 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 hover:brightness-110 active:brightness-95 shadow-[0_14px_32px_rgba(16,185,129,.35)] ring-1 ring-emerald-500/60">
          {index === slides.length - 1 ? "Start Game" : "Next →"}
        </button>
      </div>
    </div>
  );
}
