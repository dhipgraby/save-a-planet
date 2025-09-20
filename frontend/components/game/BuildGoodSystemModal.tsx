import React from "react";

export type GoodSystemCard = {
  key: string;
  name: string;
  blurb: string;
  buildCost: number;
  populationRequired: number;
  resourceIncome: number;
  planetImpact: number;
  iconSrc: string;
  pros: string[];
  cons: string[];
};

export interface BuildGoodSystemModalProps {
  title?: string;
  goods: GoodSystemCard[];
  onClose: () => void;
  onBuild: (goodKey: string) => void;
}

export default function BuildGoodSystemModal({ title = "Build a Good System", goods, onClose, onBuild }: BuildGoodSystemModalProps) {
  const tickSec = 1; // presentation only; labels are precomputed elsewhere
  return (
    <div className="w-full max-h-[50vh] overflow-auto text-slate-200 p-4 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md bg-[linear-gradient(180deg,rgba(11,18,32,0.96),rgba(8,13,24,0.96))] animate-[sap-pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[22px] font-black tracking-tight text-slate-100">{title}</div>
        <button onClick={onClose} className="bg-slate-700/80 text-white border border-slate-600 rounded-lg px-3 py-1 text-[13px] shadow-[0_1px_0_rgba(0,0,0,.55)]">
          Close
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {goods.map((g) => (
          <div key={g.key} className="bg-slate-950 border border-slate-700 rounded-xl p-3 flex gap-3 items-start">
            <div className="w-[52px] h-[52px] flex-none flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700">
              <img src={g.iconSrc} width={36} height={36} alt={g.name} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-[14px]">{g.name}</div>
              <div className="opacity-90 text-[12px] my-1">{g.blurb}</div>
              <div className="flex gap-2 flex-wrap text-[12px] opacity-90">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">Build: {g.buildCost}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">Pop req: {g.populationRequired}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">💰 +{(g.resourceIncome / tickSec).toFixed(1)}/s</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">🔥 {(g.planetImpact / tickSec).toFixed(1)}/s</span>
              </div>
              {(g.pros?.length || g.cons?.length) && (
                <div className="flex gap-3 mt-1.5">
                  {!!g.pros?.length && (
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-emerald-300 mb-1">Why it&apos;s good</div>
                      <ul className="m-0 pl-4 list-disc">{g.pros.slice(0, 2).map((p, i) => (<li key={i}>{p}</li>))}</ul>
                    </div>
                  )}
                  {!!g.cons?.length && (
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-rose-300 mb-1">Trade-offs</div>
                      <ul className="m-0 pl-4 list-disc">{g.cons.slice(0, 1).map((c, i) => (<li key={i}>{c}</li>))}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => onBuild(g.key)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,.45),_inset_0_1px_0_rgba(255,255,255,.06)] text-[14px] bg-gradient-to-b from-emerald-400 to-emerald-700 border border-emerald-700">
              <span className="inline-flex w-[18px] h-[18px] items-center justify-center">⚒️</span>
              Build
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
