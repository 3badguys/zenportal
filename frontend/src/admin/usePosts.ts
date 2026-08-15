import { useState, useEffect, useCallback } from 'react';
import { postsApi, Post } from '../api/posts';

export interface PostForm {
  slug: string;
  title: string;
  summary: string;
  body: string;
  coverImage: string;
  isPublished: boolean;
  tagIds: string[];
}

export const EMPTY_FORM: PostForm = {
  slug: '', title: '', summary: '', body: '', coverImage: '', isPublished: false, tagIds: [],
};

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
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
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowEditor(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
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
      tagIds: (post.tags || []).map((t) => t.id),
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

  const copyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const totalPages = Math.ceil(total / 20);

  return {
    posts, total, page, editing, showEditor, form, loading, message, setMessage,
    confirmDelete, copiedId, totalPages,
    setForm, setPage, setConfirmDelete, resetForm, openNew,
    handleEdit, handleSave, executeDelete, handleTogglePublish, copyId,
  };
}
