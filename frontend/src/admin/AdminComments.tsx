import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import { useComments } from './useComments';

export default function AdminComments() {
  const c = useComments();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Comments ({c.total})</h2>
        <div className="flex gap-1">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { c.setFilter(f); c.setPage(1); }}
              className={`px-3 py-1 text-xs rounded transition-colors ${c.filter === f ? 'bg-gray-900 text-white' : 'border text-gray-600 hover:bg-gray-100'}`}
            >
              {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Approved'}
            </button>
          ))}
        </div>
      </div>

      {c.selected.size > 0 && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between text-sm">
          <span className="text-blue-700">{c.selected.size} comment(s) selected</span>
          <div className="flex gap-2">
            <button onClick={c.handleBatchApprove} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Approve Selected</button>
            <button onClick={() => { if (c.selected.size > 0) c.setConfirmBatchDelete(true); }} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Delete Selected</button>
            <button onClick={() => c.setSelected(new Set())} className="px-3 py-1 text-xs border rounded hover:bg-gray-100 transition-colors">Clear</button>
          </div>
        </div>
      )}

      {c.message && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm flex items-center justify-between">
          <span>{c.message}</span>
          <button onClick={() => c.setMessage('')} className="text-blue-400 hover:text-blue-600 ml-2">&times;</button>
        </div>
      )}

      {c.comments.length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          <input type="checkbox" checked={c.allSelected} onChange={c.selectAll} id="select-all" />
          <label htmlFor="select-all" className="cursor-pointer select-none">Select all on page</label>
        </div>
      )}

      {c.loading && c.comments.length === 0 ? (
        <Skeleton count={6} />
      ) : (
        <div className="space-y-2">
          {c.comments.map((item) => (
            <div
              key={item.id}
              className={`p-3 border rounded transition-all hover:shadow-sm ${
                c.selected.has(item.id)
                  ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-300'
                  : item.isApproved
                    ? 'border-gray-200'
                    : 'border-yellow-300 bg-yellow-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={c.selected.has(item.id)} onChange={() => c.toggleSelect(item.id)} className="mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.post && <span className="text-xs text-blue-600 truncate">{item.post.title}</span>}
                    {!item.isApproved && <span className="text-xs px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded">Pending</span>}
                  </div>
                  <p className="text-sm text-gray-700">{item.content}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>IP: {item.ip}</span>
                    <span>{new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!item.isApproved && (
                    <button onClick={() => c.handleApprove(item.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Approve</button>
                  )}
                  <button onClick={() => c.setConfirmDelete({ id: item.id })} className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {c.comments.length === 0 && !c.loading && <p className="text-gray-400 text-center py-8 text-sm">No comments found.</p>}

      {c.totalPages > 1 && <Pagination page={c.page} totalPages={c.totalPages} onPage={c.setPage} />}

      {c.confirmDelete && (
        <ConfirmDialog
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          onConfirm={c.executeDelete}
          onCancel={() => c.setConfirmDelete(null)}
        />
      )}
      {c.confirmBatchDelete && (
        <ConfirmDialog
          title="Batch Delete Comments"
          message={`Are you sure you want to delete ${c.selected.size} comment(s)? This action cannot be undone.`}
          onConfirm={c.executeBatchDelete}
          onCancel={() => c.setConfirmBatchDelete(false)}
          confirmLabel={`Delete ${c.selected.size}`}
        />
      )}
    </div>
  );
}
