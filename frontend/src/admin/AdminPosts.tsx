import { useState, useEffect, useCallback } from 'react';
import { postsApi, Post } from '../api/posts';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import PostEditor from './PostEditor';

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState({
    slug: '',
    title: '',
    summary: '',
    body: '',
    coverImage: '',
    isPublished: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postsApi.adminList(page);
      setPosts(res.data.items);
      setTotal(res.data.total);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const resetForm = () => {
    setForm({ slug: '', title: '', summary: '', body: '', coverImage: '', isPublished: false });
    setEditing(null);
    setShowEditor(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ slug: '', title: '', summary: '', body: '', coverImage: '', isPublished: false });
    setShowEditor(true);
  };

  const handleEdit = (post: Post) => {
    setEditing(post);
    setForm({
      slug: post.slug,
      title: post.title,
      summary: post.summary || '',
      body: post.body,
      coverImage: post.coverImage || '',
      isPublished: post.isPublished,
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.slug || !form.title || !form.body) {
      setMessage('slug, title, body are required');
      return;
    }
    setLoading(true);
    try {
      if (editing?.id) {
        await postsApi.update(editing.id, form);
        setMessage('Updated!');
      } else {
        await postsApi.create(form);
        setMessage('Created!');
      }
      resetForm();
      fetchPosts();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await postsApi.delete(confirmDelete.id);
      fetchPosts();
      setMessage('Deleted!');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleTogglePublish = async (post: Post) => {
    try {
      await postsApi.update(post.id, { isPublished: !post.isPublished });
      fetchPosts();
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Posts ({total})</h2>
        <button onClick={openNew} className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">
          + New Post
        </button>
      </div>

      {message && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-blue-400 hover:text-blue-600 ml-2">&times;</button>
        </div>
      )}

      {showEditor && (
        <PostEditor
          editing={editing}
          form={form}
          loading={loading}
          onChange={setForm}
          onSave={handleSave}
          onClose={resetForm}
        />
      )}

      {loading && posts.length === 0 ? (
        <Skeleton count={6} />
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200 rounded transition-all hover:border-gray-300 hover:shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{p.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${p.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">/{p.slug} <button onClick={async () => { await navigator.clipboard.writeText(p.id); setCopiedId(p.id); setTimeout(() => setCopiedId(null), 1500); }} title="Copy post ID" className="ml-1 text-gray-300 hover:text-gray-500">{copiedId === p.id ? '✓ Copied' : '📋'}</button></div>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => handleEdit(p)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100 transition-colors">Edit</button>
                <button onClick={() => handleTogglePublish(p)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100 transition-colors">
                  {p.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => setConfirmDelete({ id: p.id, title: p.title })} className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {posts.length === 0 && !loading && <p className="text-gray-400 text-center py-8 text-sm">No posts found.</p>}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} />}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Post"
          message={`Are you sure you want to delete "${confirmDelete.title}"? This action cannot be undone.`}
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
