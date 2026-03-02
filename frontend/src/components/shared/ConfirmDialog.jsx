import { X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-5"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: 'var(--border-base)' }} />
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: danger ? 'var(--s-red-bg)' : 'var(--s-yellow-bg)' }}
          >
            <AlertTriangle size={16} style={{ color: danger ? 'var(--s-red-text)' : 'var(--s-yellow-text)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-base)' }}>{title}</p>
            {message && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 justify-center btn"
            style={{
              backgroundColor: danger ? 'var(--s-red-text)' : 'var(--brand)',
              color: 'white',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
