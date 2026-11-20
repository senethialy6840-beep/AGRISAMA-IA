'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[#14231B]/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 border border-emerald-950/[0.08] shadow-xl space-y-4 anim-modal-spring">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm text-slate-600 leading-relaxed">{description}</div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
              variant === 'danger'
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Traitement...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
