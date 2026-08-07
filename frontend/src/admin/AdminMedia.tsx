import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import Lightbox from './Lightbox';
import UnreferencedPanel from './UnreferencedPanel';
import { useMedia } from './useMedia';

export default function AdminMedia() {
  const m = useMedia();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Media ({m.total})</h2>
        <div className="flex gap-2">
          <button onClick={m.handleFindUnreferenced} className="px-3 py-1.5 text-xs border rounded hover:bg-gray-100 transition-colors">
            Find Unreferenced
          </button>
          <label className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors cursor-pointer">
            + Upload
            <input ref={m.fileRef} type="file" onChange={m.handleUpload} className="hidden" accept="image/*,video/*,audio/*" />
          </label>
        </div>
      </div>

      {m.message && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm flex items-center justify-between">
          <span>{m.message}</span>
          <button onClick={() => m.setMessage('')} className="text-blue-400 hover:text-blue-600 ml-2">&times;</button>
        </div>
      )}

      {m.showUnreferenced && (
        <UnreferencedPanel
          unreferenced={m.unreferenced}
          selected={m.selected}
          onToggle={m.toggleSelect}
          onClose={() => m.setShowUnreferenced(false)}
          onBatchDelete={() => { if (m.selected.size > 0) m.setConfirmBatch(true); }}
          batchConfirmOpen={m.confirmBatch}
          onBatchConfirm={m.executeBatchDelete}
          onBatchCancel={() => m.setConfirmBatch(false)}
          selectedCount={m.selected.size}
        />
      )}

      {m.loading && m.media.length === 0 ? (
        <Skeleton count={16} variant="grid" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {m.media.map((item) => {
            const lbIdx = m.getLightboxIndex(item);
            const isPreviewable = lbIdx >= 0;
            return (
              <div key={item.id} className="group relative border border-gray-200 rounded overflow-hidden transition-all hover:shadow-md">
                {item.mimeType?.startsWith('image/') ? (
                  <img
                    src={item.filePath}
                    alt={item.originalName}
                    className="w-full aspect-square object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => isPreviewable && m.openLightbox(lbIdx)}
                  />
                ) : item.mimeType?.startsWith('video/') ? (
                  <div
                    className="w-full aspect-square bg-gray-100 flex items-center justify-center text-2xl cursor-pointer transition-colors group-hover:bg-gray-200"
                    onClick={() => isPreviewable && m.openLightbox(lbIdx)}
                  >
                    🎬
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-2xl">🎵</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); m.handleCopyPath(item.filePath); }} className="px-2 py-1 bg-white text-xs rounded shadow hover:bg-gray-100 transition-colors" title="Copy path">📋</button>
                  <button onClick={(e) => { e.stopPropagation(); m.setConfirmDelete({ id: item.id, name: item.originalName }); }} className="px-2 py-1 bg-white text-xs rounded shadow text-red-600 hover:bg-red-50 transition-colors" title="Delete">🗑</button>
                </div>
                <div className="p-1 text-[10px] text-gray-400 truncate">{item.originalName}</div>
              </div>
            );
          })}
        </div>
      )}

      {m.media.length === 0 && !m.loading && <p className="text-gray-400 text-center py-8 text-sm">No media files found.</p>}

      {m.totalPages > 1 && <Pagination page={m.page} totalPages={m.totalPages} onPage={m.setPage} />}

      {m.lightboxIndex !== null && (
        <Lightbox media={m.previewable} index={m.lightboxIndex} onClose={m.closeLightbox} onPrev={m.prevLightbox} onNext={m.nextLightbox} />
      )}
      {m.confirmDelete && (
        <ConfirmDialog
          title="Delete File"
          message={`Are you sure you want to delete "${m.confirmDelete.name}"? This action cannot be undone.`}
          onConfirm={m.executeDelete}
          onCancel={() => m.setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
