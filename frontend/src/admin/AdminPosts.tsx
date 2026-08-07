import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import PostEditor from './PostEditor';
import { usePosts } from './usePosts';

export default function AdminPosts() {
  const p = usePosts();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Posts ({p.total})</h2>
        <button onClick={p.openNew} className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">
          + New Post
        </button>
      </div>

      {p.message && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm flex items-center justify-between">
          <span>{p.message}</span>
          <button onClick={() => p.setMessage('')} className="text-blue-400 hover:text-blue-600 ml-2">&times;</button>
        </div>
      )}

      {p.showEditor && (
        <PostEditor
          editing={p.editing}
          form={p.form}
          loading={p.loading}
          onChange={p.setForm}
          onSave={p.handleSave}
          onClose={p.resetForm}
        />
      )}

      {p.loading && p.posts.length === 0 ? (
        <Skeleton count={6} />
      ) : (
        <div className="space-y-2">
          {p.posts.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded transition-all hover:border-gray-300 hover:shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{item.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  /{item.slug} <button onClick={() => p.copyId(item.id)} title="Copy post ID" className="ml-1 text-gray-300 hover:text-gray-500">{p.copiedId === item.id ? '✓ Copied' : '📋'}</button>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => p.handleEdit(item)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100 transition-colors">Edit</button>
                <button onClick={() => p.handleTogglePublish(item)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100 transition-colors">
                  {item.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => p.setConfirmDelete({ id: item.id, title: item.title })} className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {p.posts.length === 0 && !p.loading && <p className="text-gray-400 text-center py-8 text-sm">No posts found.</p>}

      {p.totalPages > 1 && <Pagination page={p.page} totalPages={p.totalPages} onPage={p.setPage} />}

      {p.confirmDelete && (
        <ConfirmDialog
          title="Delete Post"
          message={`Are you sure you want to delete "${p.confirmDelete.title}"? This action cannot be undone.`}
          onConfirm={p.executeDelete}
          onCancel={() => p.setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
