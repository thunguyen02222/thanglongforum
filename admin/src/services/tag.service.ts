import { apiRequest } from './api-request';

class TagServiceAdmin {
  async search(params?: Record<string, any>): Promise<any> {
    return apiRequest.get('/admin/tags', { params });
  }

  async create(data: { name: string }): Promise<any> {
    return apiRequest.post('/admin/tags', data);
  }

  async update(id: string, data: { name: string }): Promise<any> {
    return apiRequest.put(`/admin/tags/${id}`, data);
  }

  async delete(id: string): Promise<any> {
    return apiRequest.delete(`/admin/tags/${id}`);
  }
}

export const tagService = new TagServiceAdmin();
