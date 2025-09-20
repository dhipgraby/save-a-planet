import React from "react";
import { gameConfig } from "@/data/gameConfig";

export interface GoodSystemSellModalProps {
  good: {
    key: string;
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    iconSrc: string;
    resourceIncome: number;
    planetImpact: number;
  };
  refund: number;
  onClose: () => void;
  onSell: () => void;
}

export default function GoodSystemSellModal({ good, refund, onClose, onSell }: GoodSystemSellModalProps) {
  const tickSec = gameConfig.tickDurationMs / 1000;
  const incPerSec = good.resourceIncome / tickSec;
  const impPerSec = good.planetImpact / tickSec;
  const isDamage = impPerSec > 0;
  return (
    <div className="w-full max-h-[70vh] overflow-auto text-slate-200 p-5 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md bg-[linear-gradient(180deg,rgba(11,18,32,0.96),rgba(8,13,24,0.96))] animate-[sap-pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[20px] font-black tracking-tight text-slate-100">{good.name}</div>
        <button onClick={onClose} className="bg-slate-700/80 text-white border border-slate-600 rounded-lg px-3 py-1 text-[13px] shadow-[0_1px_0_rgba(0,0,0,.55)]">
          Close
        </button>
      </div>
      <div className="flex gap-5 items-start mb-5">
        <img src={good.iconSrc} width={60} height={60} alt={good.name} className="bg-slate-900 border border-slate-700 rounded-xl p-3"/>
        <div className="flex-1 min-w-0 opacity-95">
          <div className="mb-1.5 opacity-95 text-[14px] leading-tight">{good.description}</div>
          <div className="flex gap-2 flex-wrap text-[12px] opacity-90 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300">🪙 +{incPerSec.toFixed(1)}/s</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 ${isDamage ? "text-rose-300" : "text-emerald-300"}`}>🔥 {Math.abs(impPerSec).toFixed(1)}/s</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="m-0 mb-1.5 font-black text-[15px] text-emerald-300">Pros</h4>
              <ul className="m-0 pl-0 list-none">
                {good.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 my-1.5 text-[14px]"><span className="w-[18px] h-[18px] inline-flex items-center justify-center mt-[2px] text-[16px]">✔️</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="m-0 mb-1.5 font-black text-[15px] text-rose-300">Cons</h4>
              <ul className="m-0 pl-0 list-none">
                {good.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 my-1.5 text-[14px]"><span className="w-[18px] h-[18px] inline-flex items-center justify-center mt-[2px] text-[16px]">⚠️</span><span>{c}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 my-3">
        <div className="opacity-90 text-[14px]">Refund: {refund}</div>
        <button onClick={onSell} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,.45),_inset_0_1px_0_rgba(255,255,255,.06)] text-[14px] bg-gradient-to-b from-amber-300 to-amber-600 border border-amber-700 text-slate-900">
          <span className="inline-flex w-[18px] h-[18px] items-center justify-center">💰</span>
          Sell
        </button>
      </div>
    </div>
  );
}
