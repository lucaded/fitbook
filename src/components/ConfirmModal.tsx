"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-[#121212] border border-[#1e1e1e] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm sm:mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-semibold text-neutral-100 mb-2">{title}</h3>
        <p className="text-[13px] text-neutral-500 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 btn-ghost text-[13px] py-2.5 text-center">{cancelLabel}</button>
          <button onClick={onConfirm}
            className={`flex-1 text-[13px] font-medium py-2.5 rounded-xl transition-all duration-200 ${
              destructive
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                : "btn-primary"
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
