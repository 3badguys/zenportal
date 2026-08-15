import { useState } from 'react';
import AdminPosts from './AdminPosts';
import AdminTags from './AdminTags';
import AdminComments from './AdminComments';
import AdminMedia from './AdminMedia';
import AdminLayout from './AdminLayout';
import AdminBackup from './AdminBackup';

const tabs = [
  { key: 'posts', label: '📝 Posts', cmp: AdminPosts },
  { key: 'tags', label: '🏷️ Tags', cmp: AdminTags },
  { key: 'media', label: '🖼️ Media', cmp: AdminMedia },
  { key: 'layout', label: '🧩 Layout', cmp: AdminLayout },
  { key: 'comments', label: '💬 Comments', cmp: AdminComments },
  { key: 'backup', label: '💾 Backup', cmp: AdminBackup },
];

export default function AdminPage() {
  const [active, setActive] = useState('posts');
  const Cmp = tabs.find((t) => t.key === active)!.cmp;

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-4 flex gap-0">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActive(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              active === t.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t.label}</button>
        ))}
      </div>
      <div className="p-4 max-w-5xl mx-auto">
        <Cmp />
      </div>
    </div>
  );
}
