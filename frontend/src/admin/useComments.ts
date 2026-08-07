import { useState, useEffect, useCallback } from 'react';
import { commentsApi, Comment } from '../api/comments';

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const approved = filter === 'all' ? undefined : filter === 'approved';
      const res = await commentsApi.adminList(page, 20, approved);
      setComments(res.data.items);
      setTotal(res.data.total);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => { setSelected(new Set()); }, [page, filter]);

  const handleApprove = async (id: string) => {
    try {
      await commentsApi.approve(id);
      fetchComments();
      setMessage('Approved!');
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await commentsApi.delete(confirmDelete.id);
      fetchComments();
      setMessage('Deleted!');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === comments.length) setSelected(new Set());
    else setSelected(new Set(comments.map(c => c.id)));
  };

  const handleBatchApprove = async () => {
    setLoading(true);
    let approved = 0;
    for (const id of selected) {
      try { await commentsApi.approve(id); approved++; } catch {}
    }
    setMessage(`Approved ${approved} comment(s)`);
    setSelected(new Set());
    fetchComments();
    setLoading(false);
  };

  const executeBatchDelete = async () => {
    setConfirmBatchDelete(false);
    setLoading(true);
    let deleted = 0;
    for (const id of selected) {
      try { await commentsApi.delete(id); deleted++; } catch {}
    }
    setMessage(`Deleted ${deleted} comment(s)`);
    setSelected(new Set());
    fetchComments();
    setLoading(false);
  };

  const totalPages = Math.ceil(total / 20);
  const allSelected = comments.length > 0 && selected.size === comments.length;

  return {
    comments, page, setPage, total, filter, setFilter, loading, message, setMessage,
    selected, setSelected, confirmDelete, setConfirmDelete, confirmBatchDelete, setConfirmBatchDelete,
    handleApprove, executeDelete, toggleSelect, selectAll,
    handleBatchApprove, executeBatchDelete, totalPages, allSelected,
  };
}
