import { apiRequest } from './api-request';
import { ITag } from '@interfaces/question';

class TagService {
  async search(q?: string): Promise<{ data: { data: ITag[] } }> {
    return apiRequest.get('/tags', { params: { q, limit: 20 } });
  }

  async getPopular(limit?: number): Promise<{ data: ITag[] }> {
    return apiRequest.get('/tags/popular', { params: { limit: limit || 20 } });
  }
}

export const tagService = new TagService();
