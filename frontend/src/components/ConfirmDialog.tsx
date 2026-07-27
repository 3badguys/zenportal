interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const btnClass =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-gray-900 text-white hover:bg-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl p-5 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-3 py-1.5 text-sm rounded transition-colors ${btnClass}`}>
            {confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
