import { useState, useEffect, useCallback, useRef } from 'react';
import { mediaApi, Medium } from '../api/media';

export function useMedia() {
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
  const [deleteError, setDeleteError] = useState<{ message: string; refs: string[] } | null>(null);

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

  useEffect(() => { fetchMedia(page); }, [page, fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (Array.isArray(e.refs)) setDeleteError({ message: e.message, refs: e.refs });
      else setMessage(e.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path).then(() => setMessage(`Copied: ${path}`));
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
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prevLightbox = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const nextLightbox = () => setLightboxIndex(i => (i !== null && i < media.length - 1 ? i + 1 : i));

  const previewable = media.filter(m => m.mimeType?.startsWith('image/') || m.mimeType?.startsWith('video/') || m.mimeType?.startsWith('audio/'));
  const getLightboxIndex = (m: Medium) => previewable.findIndex(p => p.id === m.id);
  const totalPages = Math.ceil(total / 50);

  return {
    media, total, page, setPage, loading, message, setMessage,
    unreferenced, showUnreferenced, selected, confirmDelete, confirmBatch,
    deleteError, setDeleteError,
    fileRef, lightboxIndex,
    handleUpload, executeDelete, handleCopyPath, handleFindUnreferenced,
    executeBatchDelete, toggleSelect, openLightbox, closeLightbox,
    prevLightbox, nextLightbox, previewable, getLightboxIndex, totalPages,
    setShowUnreferenced, setConfirmDelete, setConfirmBatch,
  };
}
