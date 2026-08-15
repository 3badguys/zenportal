import client from './client';
import axios from 'axios';

export type BackupType = 'database' | 'media';

export interface BackupFile {
  type: BackupType;
  filename: string;
  size: number;
  mtime: string;
}

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// downloads need raw axios to read Content-Disposition (client interceptor unwraps headers)
async function download(type: BackupType, filename?: string): Promise<void> {
  const token = localStorage.getItem('admin_token');
  const url = filename ? `${BASE}/admin/backup/${encodeURIComponent(filename)}` : `${BASE}/admin/backup/${type}`;
  const res = await axios.get(url, {
    headers: token ? { 'X-Admin-Token': token } : undefined,
    responseType: 'blob',
  });
  const cd: string = res.headers['content-disposition'] || '';
  const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const name = m ? decodeURIComponent(m[1]) : (type === 'database' ? 'zenportal_database.sql' : 'zenportal_media.tar.gz');
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export const backupApi = {
  list: () => client.get('/admin/backup/list') as Promise<{ data: BackupFile[] }>,
  // create a fresh backup and download it
  createAndDownload: (type: BackupType) => download(type),
  // download an existing backup file from the list
  downloadExisting: (filename: string) => download(filename.startsWith('zenportal_database_') ? 'database' : 'media', filename),
  remove: (filename: string) =>
    client.delete(`/admin/backup/${encodeURIComponent(filename)}`) as Promise<{ data: any }>,
  restore: (type: BackupType, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post(`/admin/restore/${type}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<{ data: any }>;
  },
};
