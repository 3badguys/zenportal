import { useState } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TagSelector from './TagSelector';

interface PostForm {
  slug: string;
  title: string;
  summary: string;
  body: string;
  coverImage: string;
  isPublished: boolean;
  tagIds: string[];
}

interface Props {
  editing: { id?: string } | null;
  form: PostForm;
  loading: boolean;
  onChange: (form: PostForm) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function PostEditor({ editing, form, loading, onChange, onSave, onClose }: Props) {
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  const set = (patch: Partial<PostForm>) => onChange({ ...form, ...patch });

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-[5vh] bg-black/40">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl min-w-0 sm:mx-4 h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-semibold text-gray-800">
            {editing ? 'Edit Post' : 'New Post'}
          </h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={e => set({ isPublished: e.target.checked })}
              />
              Published
            </label>
            <button
              onClick={onSave}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={e => set({ slug: e.target.value })}
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cover Image URL</label>
              <input
                value={form.coverImage}
                onChange={e => set({ coverImage: e.target.value })}
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={e => set({ title: e.target.value })}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Summary</label>
            <input
              value={form.summary}
              onChange={e => set({ summary: e.target.value })}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>
          <TagSelector selected={form.tagIds} onChange={(ids) => set({ tagIds: ids })} />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Body (Markdown) *</label>
              <div className="flex gap-0.5 text-xs">
                <button
                  onClick={() => setPreviewTab('edit')}
                  className={`px-2 py-0.5 rounded-t border-b-2 transition-colors ${
                    previewTab === 'edit'
                      ? 'border-gray-900 text-gray-900 font-medium'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setPreviewTab('preview')}
                  className={`px-2 py-0.5 rounded-t border-b-2 transition-colors ${
                    previewTab === 'preview'
                      ? 'border-gray-900 text-gray-900 font-medium'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>
            {previewTab === 'edit' ? (
              <textarea
                value={form.body}
                onChange={e => set({ body: e.target.value })}
                className="w-full px-3 py-2 border rounded font-mono text-base min-h-[60vh] resize-y"
              />
            ) : (
              <div className="w-full px-3 py-2 border rounded h-[60vh] bg-gray-50 overflow-auto">
                {form.body ? (
                  <MarkdownRenderer content={form.body} />
                ) : (
                  <span className="text-gray-300 text-sm italic">Nothing to preview</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
