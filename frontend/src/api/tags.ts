import client from './client';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export interface TagListResult {
  items: Tag[]; total: number; page: number; pageSize: number;
}

export const tagsApi = {
  publicList: () => client.get('/tags') as Promise<{ data: Tag[] }>,
  all: () => client.get('/admin/tags/all') as Promise<{ data: Tag[] }>,
  list: (page = 1, pageSize = 50) =>
    client.get(`/admin/tags?page=${page}&pageSize=${pageSize}`) as Promise<{ data: TagListResult }>,
  create: (data: Partial<Tag>) => client.post('/admin/tags', data) as Promise<{ data: Tag }>,
  update: (id: string, data: Partial<Tag>) => client.put(`/admin/tags/${id}`, data) as Promise<{ data: Tag }>,
  remove: (id: string) => client.delete(`/admin/tags/${id}`) as Promise<{ data: any }>,
  merge: (id: string, targetId: string) =>
    client.post(`/admin/tags/${id}/merge`, { targetId }) as Promise<{ data: any }>,
};
