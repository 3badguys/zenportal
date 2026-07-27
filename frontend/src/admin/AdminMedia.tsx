import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { mediaApi, Medium } from '../api/media';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import Lightbox from './Lightbox';
import UnreferencedPanel from './UnreferencedPanel';

export default function AdminMedia() {
  const [media, setMedia] = useState<Medium[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [unreferenced, setUnreferenced] = useState<Medium[]>([]);
  const [showUnreferenced, setShowUnreferenced] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmBatch, setConfirmBatch] = useState(false);

  const fetchMedia = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await mediaApi.list(p);
      setMedia(res.data.items);
      setTotal(res.data.total);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchMedia(page); }, [page]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await mediaApi.upload(file);
      setMessage('Uploaded!');
      fetchMedia();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await mediaApi.delete(confirmDelete.id);
      fetchMedia();
      setMessage('Deleted!');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path).then(() => setMessage('Copied!'));
  };

  const handleFindUnreferenced = async () => {
    setLoading(true);
    try {
      const res = await mediaApi.unreferenced();
      setUnreferenced(res.data);
      setShowUnreferenced(true);
      setSelected(new Set());
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const executeBatchDelete = async () => {
    try {
      await mediaApi.deleteUnreferenced(Array.from(selected));
      setMessage(`Deleted ${selected.size} files`);
      setShowUnreferenced(false);
      setSelected(new Set());
      fetchMedia();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setConfirmBatch(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prevLightbox = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const nextLightbox = () => setLightboxIndex(i => (i !== null && i < media.length - 1 ? i + 1 : i));
  const previewable = media.filter(m => m.mimeType?.startsWith('image/') || m.mimeType?.startsWith('video/'));
  const getLightboxIndex = (m: Medium) => previewable.findIndex(p => p.id === m.id);

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Media ({total})</h2>
        <div className="flex gap-2">
          <button onClick={handleFindUnreferenced} className="px-3 py-1.5 text-xs border rounded hover:bg-gray-100 transition-colors">
            Find Unreferenced
          </button>
          <label className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors cursor-pointer">
            + Upload
            <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" accept="image/*,video/*,audio/*" />
          </label>
        </div>
      </div>

      {message && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-blue-400 hover:text-blue-600 ml-2">&times;</button>
        </div>
      )}

      {showUnreferenced && (
        <UnreferencedPanel
          unreferenced={unreferenced}
          selected={selected}
          onToggle={toggleSelect}
          onClose={() => setShowUnreferenced(false)}
          onBatchDelete={() => { if (selected.size > 0) setConfirmBatch(true); }}
          batchConfirmOpen={confirmBatch}
          onBatchConfirm={executeBatchDelete}
          onBatchCancel={() => setConfirmBatch(false)}
          selectedCount={selected.size}
        />
      )}

      {loading && media.length === 0 ? (
        <Skeleton count={16} variant="grid" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {media.map((m) => {
            const lbIdx = getLightboxIndex(m);
            const isPreviewable = lbIdx >= 0;
            return (
              <div key={m.id} className="group relative border border-gray-200 rounded overflow-hidden transition-all hover:shadow-md">
                {m.mimeType?.startsWith('image/') ? (
                  <img
                    src={m.filePath}
                    alt={m.originalName}
                    className="w-full aspect-square object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => isPreviewable && openLightbox(lbIdx)}
                  />
                ) : m.mimeType?.startsWith('video/') ? (
                  <div
                    className="w-full aspect-square bg-gray-100 flex items-center justify-center text-2xl cursor-pointer transition-colors group-hover:bg-gray-200"
                    onClick={() => isPreviewable && openLightbox(lbIdx)}
                  >
                    🎬
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-2xl">🎵</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); handleCopyPath(m.filePath); }} className="px-2 py-1 bg-white text-xs rounded shadow hover:bg-gray-100 transition-colors" title="Copy path">📋</button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: m.id, name: m.originalName }); }} className="px-2 py-1 bg-white text-xs rounded shadow text-red-600 hover:bg-red-50 transition-colors" title="Delete">🗑</button>
                </div>
                <div className="p-1 text-[10px] text-gray-400 truncate">{m.originalName}</div>
              </div>
            );
          })}
        </div>
      )}

      {media.length === 0 && !loading && <p className="text-gray-400 text-center py-8 text-sm">No media files found.</p>}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} />}

      {lightboxIndex !== null && (
        <Lightbox media={previewable} index={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete File"
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
