import client from './client';

export interface Medium {
  id: string; filename: string; originalName: string;
  filePath: string; fileSize?: number; mimeType?: string; createdAt: string;
}

export interface MediaListResult {
  items: Medium[]; total: number; page: number; pageSize: number;
}

export const mediaApi = {
  list: (page = 1, pageSize = 50) => client.get(`/admin/media?page=${page}&pageSize=${pageSize}`) as Promise<{ data: MediaListResult }>,
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post('/admin/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }) as Promise<{ data: Medium }>;
  },
  delete: (id: string) => client.delete(`/admin/media/${id}`) as Promise<{ data: Medium }>,
  unreferenced: () => client.get('/admin/media/unreferenced') as Promise<{ data: Medium[] }>,
  deleteUnreferenced: (ids: string[]) => client.delete('/admin/media/unreferenced/batch', { data: { ids } }) as Promise<{ data: any }>,
};
