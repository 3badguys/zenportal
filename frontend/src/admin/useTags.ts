import { useState, useCallback, useEffect } from 'react';
import { tagsApi, Tag } from '../api/tags';

export interface TagForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
}

export const EMPTY_TAG_FORM: TagForm = { name: '', slug: '', description: '' };

const slugify = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<TagForm>(EMPTY_TAG_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const [merge, setMerge] = useState<Tag | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<Tag | null>(null);
  const [blocked, setBlocked] = useState<{ name: string; refs: string[] } | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tagsApi.list(1, 100);
      setTags(res.data.items);
      setTotal(res.data.total);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const openCreate = () => {
    setForm(EMPTY_TAG_FORM);
    setSlugTouched(false);
    setEditorOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setForm({ id: tag.id, name: tag.name, slug: tag.slug, description: tag.description || '' });
    setSlugTouched(true);
    setEditorOpen(true);
  };

  const onNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  const saveTag = async () => {
    if (!form.name.trim()) { setMessage('Name is required'); return; }
    try {
      if (form.id) {
        await tagsApi.update(form.id, { name: form.name, slug: form.slug || slugify(form.name), description: form.description });
        setToast('Tag updated');
      } else {
        await tagsApi.create({ name: form.name, slug: form.slug || slugify(form.name), description: form.description });
        setToast('Tag created');
      }
      setEditorOpen(false);
      fetchTags();
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const requestDelete = (tag: Tag) => setConfirmDelete(tag);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await tagsApi.remove(confirmDelete.id);
      setToast('Tag deleted');
      fetchTags();
    } catch (e: any) {
      if (Array.isArray(e.refs)) setBlocked({ name: confirmDelete.name, refs: e.refs });
      else setMessage(e.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const executeMerge = async () => {
    if (!merge || !mergeTarget) return;
    try {
      await tagsApi.merge(merge.id, mergeTarget);
      setToast(`Merged "${merge.name}" into target`);
      setMerge(null);
      setMergeTarget('');
      fetchTags();
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  return {
    tags, total, loading, message, toast,
    editorOpen, setEditorOpen, form, merge, mergeTarget, confirmDelete, blocked, slugTouched,
    setSlugTouched, setForm, setMessage,
    openCreate, openEdit, onNameChange, saveTag,
    requestDelete, executeDelete, setConfirmDelete,
    setMerge, setMergeTarget, executeMerge, setBlocked,
    fetchTags,
  };
}
