import client from './client';

export interface Block {
  id: string; type: string; props: Record<string, any>;
}

export interface LayoutData {
  pageSlug: string; blocks: Block[];
}

export const layoutApi = {
  get: (pageSlug = 'home', signal?: AbortSignal) => client.get(`/layout/${pageSlug}`, { signal }) as Promise<{ data: LayoutData }>,
  update: (pageSlug: string, blocks: Block[]) => client.put(`/admin/layout/${pageSlug}`, { blocks }) as Promise<{ data: LayoutData }>,
};
