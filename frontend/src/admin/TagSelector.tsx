import { useEffect, useMemo, useState } from 'react';
import { tagsApi, Tag } from '../api/tags';

const MAX_TAGS = 5;

export default function TagSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    tagsApi.all().then((res) => setTags(res.data)).catch(() => { /* tags optional */ });
  }, []);

  const selectedTags = useMemo(() => tags.filter((t) => selected.includes(t.id)), [tags, selected]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }, [tags, search]);

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else if (selected.length < MAX_TAGS) onChange([...selected, id]);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
      <div className="relative">
        <div className="flex items-center gap-1.5 flex-wrap px-3 py-1.5 border rounded min-h-[38px]">
          {selectedTags.length === 0 && <span className="text-sm text-gray-400">No tags selected</span>}
          {selectedTags.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
              {t.name}
              <button type="button" onClick={() => toggle(t.id)} className="text-gray-400 hover:text-gray-700">&times;</button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="ml-auto text-gray-400 hover:text-gray-700 px-1"
            title="Select tags"
          >
            ▼
          </button>
        </div>

        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg p-3">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full px-3 py-1.5 border rounded text-sm mb-2"
            />
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filtered.length === 0 && <p className="text-sm text-gray-400 py-2">No tags found</p>}
              {filtered.map((t) => {
                const checked = selected.includes(t.id);
                const disabled = !checked && selected.length >= MAX_TAGS;
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-50 ${
                      disabled ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(t.id)}
                      className="accent-gray-900"
                    />
                    <span>{t.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{t.slug}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              💡 Only existing tags can be selected — create new ones in the Tags tab.
            </p>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">💡 Choose 1-{MAX_TAGS} tags</p>
    </div>
  );
}
