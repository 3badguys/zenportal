import client from './client';

export interface Comment {
  id: string; postId: string; content: string; ip: string;
  isApproved: boolean; parentId?: string;
  createdAt: string; post?: { slug: string; title: string };
}

export interface CommentGroup {
  visitorId: string;
  comments: Comment[];
}

export interface CommentListResult {
  items: Comment[]; total: number; page: number; pageSize: number;
}

export const commentsApi = {
  getByPost: (slug: string) => client.get(`/posts/${slug}/comments`) as Promise<{ data: CommentGroup[] }>,
  create: (slug: string, content: string, parentId?: string) =>
    client.post(`/posts/${slug}/comments`, { content, parentId }) as Promise<{ data: Comment }>,
  adminList: (page = 1, pageSize = 20, approved?: boolean) =>
    client.get(`/admin/comments?page=${page}&pageSize=${pageSize}${approved !== undefined ? `&approved=${approved}` : ''}`) as Promise<{ data: CommentListResult }>,
  approve: (id: string) => client.put(`/admin/comments/${id}/approve`) as Promise<{ data: Comment }>,
  delete: (id: string) => client.delete(`/admin/comments/${id}`) as Promise<{ data: Comment }>,
};
