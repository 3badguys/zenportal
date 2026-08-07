import client from './client';

export interface Post {
  id: string; slug: string; title: string; summary?: string;
  body: string; coverImage?: string; isPublished: boolean;
  publishedAt?: string; createdAt: string; updatedAt: string;
}

export interface PostListResult {
  items: Post[]; total: number; page: number; pageSize: number;
}

export const postsApi = {
  getList: (page = 1, pageSize = 10, signal?: AbortSignal) =>
    client.get(`/posts?page=${page}&pageSize=${pageSize}`, { signal }) as Promise<{ data: PostListResult }>,
  getBySlug: (slug: string, signal?: AbortSignal) =>
    client.get(`/posts/${slug}`, { signal }) as Promise<{ data: Post }>,
  adminList: (page = 1, pageSize = 20) =>
    client.get(`/admin/posts?page=${page}&pageSize=${pageSize}`) as Promise<{ data: PostListResult }>,
  create: (data: Partial<Post>) => client.post('/admin/posts', data) as Promise<{ data: Post }>,
  update: (id: string, data: Partial<Post>) => client.put(`/admin/posts/${id}`, data) as Promise<{ data: Post }>,
  delete: (id: string) => client.delete(`/admin/posts/${id}`) as Promise<{ data: Post }>,
};
