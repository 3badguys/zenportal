import { Medium } from '../api/media';
import ConfirmDialog from '../components/ConfirmDialog';

interface Props {
  unreferenced: Medium[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
  onBatchDelete: () => void;
  batchConfirmOpen: boolean;
  onBatchConfirm: () => void;
  onBatchCancel: () => void;
  selectedCount: number;
}

export default function UnreferencedPanel({
  unreferenced,
  selected,
  onToggle,
  onClose,
  onBatchDelete,
  batchConfirmOpen,
  onBatchConfirm,
  onBatchCancel,
  selectedCount,
}: Props) {
  return (
    <>
      <div className="mb-4 p-3 border border-orange-200 bg-orange-50 rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">Unreferenced Files ({unreferenced.length})</h3>
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
            Close
          </button>
        </div>
        {unreferenced.length === 0 ? (
          <p className="text-sm text-gray-400">No unreferenced files found.</p>
        ) : (
          <>
            <div className="max-h-60 overflow-y-auto space-y-1 mb-3">
              {unreferenced.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selected.has(m.id)} onChange={() => onToggle(m.id)} />
                  <span className="text-gray-600 truncate flex-1">{m.filePath}</span>
                  <span className="text-xs text-gray-400">{m.originalName}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onBatchDelete}
              disabled={selectedCount === 0}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Delete Selected ({selectedCount})
            </button>
          </>
        )}
      </div>
      {batchConfirmOpen && (
        <ConfirmDialog
          title="Batch Delete Files"
          message={`Are you sure you want to delete ${selectedCount} file(s)? This action cannot be undone.`}
          onConfirm={onBatchConfirm}
          onCancel={onBatchCancel}
          confirmLabel={`Delete ${selectedCount}`}
        />
      )}
    </>
  );
}
