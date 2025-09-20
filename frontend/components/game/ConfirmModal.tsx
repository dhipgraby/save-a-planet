import React from "react";

export interface ConfirmModalProps {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <div className="w-full max-w-[560px] text-slate-200 p-5 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md bg-[linear-gradient(180deg,rgba(11,18,32,0.96),rgba(8,13,24,0.96))] animate-[sap-pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[20px] font-black tracking-tight text-slate-100">{title}</div>
          {description && (
            <div className="opacity-90 text-[14px] mt-1 leading-relaxed">{description}</div>
          )}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="bg-slate-700/80 text-white border border-slate-600 rounded-lg px-4 py-2 text-[14px] shadow-[0_1px_0_rgba(0,0,0,.55)] hover:brightness-110"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,.45),_inset_0_1px_0_rgba(255,255,255,.06)] text-[14px] bg-gradient-to-b from-rose-400 to-rose-700 border border-rose-700 hover:brightness-110"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
