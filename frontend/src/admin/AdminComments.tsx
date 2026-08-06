import { useState, useEffect, useCallback } from 'react';
import { commentsApi, Comment } from '../api/comments';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminComments() {
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
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Comments ({total})</h2>
        <div className="flex gap-1">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1 text-xs rounded transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'border text-gray-600 hover:bg-gray-100'}`}
            >
              {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Approved'}
            </button>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between text-sm">
          <span className="text-blue-700">{selected.size} comment(s) selected</span>
          <div className="flex gap-2">
            <button onClick={handleBatchApprove} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Approve Selected</button>
            <button onClick={() => { if (selected.size > 0) setConfirmBatchDelete(true); }} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Delete Selected</button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-1 text-xs border rounded hover:bg-gray-100 transition-colors">Clear</button>
          </div>
        </div>
      )}

      {message && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-blue-400 hover:text-blue-600 ml-2">&times;</button>
        </div>
      )}

      {comments.length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          <input type="checkbox" checked={allSelected} onChange={selectAll} id="select-all" />
          <label htmlFor="select-all" className="cursor-pointer select-none">Select all on page</label>
        </div>
      )}

      {loading && comments.length === 0 ? (
        <Skeleton count={6} />
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`p-3 border rounded transition-all hover:shadow-sm ${
                selected.has(c.id)
                  ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-300'
                  : c.isApproved
                    ? 'border-gray-200'
                    : 'border-yellow-300 bg-yellow-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {c.post && <span className="text-xs text-blue-600 truncate">{c.post.title}</span>}
                    {!c.isApproved && <span className="text-xs px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded">Pending</span>}
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>IP: {c.ip}</span>
                    <span>{new Date(c.createdAt).toISOString().replace('T', ' ').slice(0, 19)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!c.isApproved && (
                    <button onClick={() => handleApprove(c.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Approve</button>
                  )}
                  <button onClick={() => setConfirmDelete({ id: c.id })} className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && !loading && <p className="text-gray-400 text-center py-8 text-sm">No comments found.</p>}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} />}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmBatchDelete && (
        <ConfirmDialog
          title="Batch Delete Comments"
          message={`Are you sure you want to delete ${selected.size} comment(s)? This action cannot be undone.`}
          onConfirm={executeBatchDelete}
          onCancel={() => setConfirmBatchDelete(false)}
          confirmLabel={`Delete ${selected.size}`}
        />
      )}
    </div>
  );
}
