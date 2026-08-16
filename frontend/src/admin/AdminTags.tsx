import { useMemo } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useTags } from './useTags';
import { Tag } from '../api/tags';

export default function AdminTags() {
  const t = useTags();
  const slugTouched = t.slugTouched;

  const mergeCandidates = useMemo(
    () => t.tags.filter((x) => x.id !== t.merge?.id),
    [t.tags, t.merge],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">🏷️ Tags ({t.total})</h2>
        <button onClick={t.openCreate} className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">
          + New Tag
        </button>
      </div>

      {t.message && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm flex items-center justify-between">
          <span>{t.message}</span>
          <button onClick={() => t.setMessage('')} className="text-blue-400 hover:text-blue-600 ml-2">&times;</button>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Slug</th>
              <th className="py-2 px-3 font-medium">Posts</th>
              <th className="py-2 px-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {t.tags.map((tag: Tag) => (
              <tr key={tag.id} className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-800">{tag.name}</td>
                <td className="py-2 px-3 text-gray-500 font-mono text-xs">{tag.slug}</td>
                <td className="py-2 px-3 text-gray-600">{tag.postCount ?? 0}</td>
                <td className="py-2 px-3 text-right whitespace-nowrap">
                  <button onClick={() => t.openEdit(tag)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100 mr-1.5 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => t.setMerge(tag)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100 mr-1.5 transition-colors">
                    Merge
                  </button>
                  <button onClick={() => t.requestDelete(tag)} className="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {t.tags.length === 0 && !t.loading && (
              <tr><td colSpan={4} className="py-8 text-center text-gray-400">No tags found.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Create / Edit */}
      {t.editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md mx-4">
            <h3 className="font-semibold text-gray-800 mb-4">{t.form.id ? 'Edit Tag' : 'New Tag'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input
                  value={t.form.name}
                  onChange={(e) => t.onNameChange(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                <input
                  value={t.form.slug}
                  onChange={(e) => { t.setSlugTouched(true); t.setForm({ ...t.form, slug: e.target.value }); }}
                  className="w-full px-3 py-1.5 border rounded text-sm font-mono"
                />
                {!slugTouched && <p className="mt-0.5 text-xs text-gray-400">Auto-generated from name.</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={t.form.description}
                  onChange={(e) => t.setForm({ ...t.form, description: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded text-sm min-h-[60px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => t.setEditorOpen(false)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={t.saveTag} className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge */}
      {t.merge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md mx-4">
            <h3 className="font-semibold text-gray-800 mb-1">Merge Tag</h3>
            <p className="text-sm text-gray-500 mb-4">
              Merge <span className="font-medium text-gray-800">"{t.merge.name}"</span> into another tag. All posts will be re-tagged and "{t.merge.name}" will be deleted.
            </p>
            <div className="max-h-52 overflow-y-auto border rounded divide-y divide-gray-100">
              {mergeCandidates.map((c) => (
                <label key={c.id} className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${t.mergeTarget === c.id ? 'bg-gray-50' : ''}`}>
                  <input
                    type="radio"
                    name="mergeTarget"
                    checked={t.mergeTarget === c.id}
                    onChange={() => t.setMergeTarget(c.id)}
                    className="accent-gray-900"
                  />
                  <span>{c.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{c.postCount ?? 0} posts</span>
                </label>
              ))}
              {mergeCandidates.length === 0 && <p className="px-3 py-4 text-sm text-gray-400">No other tags.</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { t.setMerge(null); t.setMergeTarget(''); }} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={t.executeMerge}
                disabled={!t.mergeTarget}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {t.confirmDelete && (
        <ConfirmDialog
          title="Delete Tag"
          message={`Are you sure you want to delete tag "${t.confirmDelete.name}"?`}
          confirmLabel="Delete"
          onConfirm={t.executeDelete}
          onCancel={() => t.setConfirmDelete(null)}
        />
      )}

      {/* In-use info dialog */}
      {t.blocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md mx-4">
            <h3 className="font-semibold text-red-600 mb-2">⚠️ Cannot Delete Tag</h3>
            <p className="text-sm text-gray-600 mb-2">
              The tag <span className="font-medium">"{t.blocked.name}"</span> is used by {t.blocked.refs.length} post(s) and cannot be deleted:
            </p>
            <ul className="max-h-40 overflow-y-auto list-disc pl-5 text-sm text-gray-700 space-y-0.5 mb-3">
              {t.blocked.refs.map((title, i) => <li key={i}>{title}</li>)}
            </ul>
            <p className="text-xs text-gray-400 mb-4">
              💡 Remove the tag from those posts first, or use the Merge feature.
            </p>
            <div className="flex justify-end">
              <button onClick={() => t.setBlocked(null)} className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {t.toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded shadow-lg">
          {t.toast}
        </div>
      )}
    </div>
  );
}
