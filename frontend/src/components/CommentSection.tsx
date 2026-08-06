import { useState, type FormEvent } from 'react';
import { commentsApi, CommentGroup } from '../api/comments';
import { getVisitorColor, getDisplayName } from '../utils/visitor';
import Skeleton from './Skeleton';

interface Props {
  slug: string;
  groups: CommentGroup[];
  loading?: boolean;
}

export default function CommentSection({ slug, groups: initialGroups, loading }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalComments = groups.reduce((s, g) => s + g.comments.length, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await commentsApi.create(slug, content.trim());
      setContent('');
      const res = await commentsApi.getByPost(slug);
      setGroups(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h3 className="text-lg font-semibold mb-6">Comments ({totalComments})</h3>

      <form onSubmit={handleSubmit} className="mb-8 p-4 border border-gray-200 rounded-lg">
        <textarea placeholder="Write a comment..." value={content}
          onChange={(e) => setContent(e.target.value)} className="w-full mb-2 px-3 py-2 border border-gray-300 rounded text-sm min-h-[80px]" required />
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <button type="submit" disabled={submitting}
          className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <p className="text-xs text-gray-400 mt-2">Anonymous comment — no registration required.</p>
      </form>

      {loading && <Skeleton count={2} variant="list" />}

      {!loading && groups.length === 0 && (
        <p className="text-gray-400 text-center py-8">No comments yet. Be the first!</p>
      )}

      {!loading && groups.map((group) => {
        const color = getVisitorColor(group.visitorId);
        const first = group.comments[0];
        const name = getDisplayName(group.visitorId);

        return (
          <div key={group.visitorId} className="mb-4 border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: color }}>
                {name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-gray-700">{name}</span>
              <span className="text-xs text-gray-400">
                {group.comments.length} comment{group.comments.length > 1 ? 's' : ''}
              </span>
            </div>
            {group.comments.map((c) => (
              <div key={c.id} className="ml-8 mb-1 p-2 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">{c.content}</p>
              <time className="text-xs text-gray-400">
                  {new Date(c.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                </time>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
