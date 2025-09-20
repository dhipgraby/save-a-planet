import React from "react";

export interface WelcomeIntroPanelProps {
    onStart: () => void;
    onSkip: () => void;
}

export default function WelcomeIntroPanel({ onStart, onSkip }: WelcomeIntroPanelProps) {
  return (
    <div className="w-full max-w-[680px] text-slate-200 p-0 animate-[sap-pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 -z-10 rounded-full blur-3xl opacity-60 bg-[radial-gradient(circle,rgba(34,197,94,.35),rgba(2,6,23,0)_65%)]" />
          <img src="/game/planetIntro.png" alt="Planet" width={220} height={220} className="mx-auto drop-shadow-[0_10px_26px_rgba(0,0,0,.5)] sap-text-reveal" />
        </div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold leading-tight mb-3 bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-400 bg-clip-text text-transparent sap-text-reveal"
        >
                    Save a Planet
        </h1>
        <p className="max-w-[720px] text-[17px] sm:text-[18px] leading-relaxed text-slate-200/95 mb-6 sap-text-reveal" style={{ animationDelay: "300ms" }}>
                    We still have a chance to make our planet a better world. Small choices become big changes. Start the journey and see how your decisions shape the future.
        </p>
        {/* AI credit / hackathon disclosure */}
        <p className="max-w-[720px] text-[13px] sm:text-[14px] leading-relaxed text-slate-400 mb-6 sap-text-reveal" style={{ animationDelay: "520ms" }}>
          Built with AI: This game was created using AI agents with human direction for the Tech for Social Good hackathon—demonstrating how AI can power engaging climate education.
        </p>
        {/* Actions */}
        <div className="flex w-full items-stretch gap-3 flex-col sm:flex-row">
          <button
            onClick={onSkip}
            className="px-4 py-2 bg-slate-800/70 text-slate-200 rounded-lg font-semibold font-mono hover:brightness-110 active:brightness-95 border border-slate-700/80"
          >
                        Skip Intro
          </button>
          <button
            onClick={onStart}
            className="group relative w-full sm:flex-1 px-6 py-3 sm:py-3.5 rounded-xl font-extrabold font-mono tracking-wide text-emerald-950 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 hover:brightness-110 active:brightness-95 shadow-[0_14px_32px_rgba(16,185,129,.35)] ring-1 ring-emerald-500/60 overflow-hidden"
          >
            {/* glow aura */}
            <span className="pointer-events-none absolute -inset-2 rounded-2xl bg-emerald-400/20 blur-xl opacity-60 group-hover:opacity-90 transition" />
            {/* sheen */}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent to-white/10 opacity-40" />
            <span className="relative">▶ Start Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}
