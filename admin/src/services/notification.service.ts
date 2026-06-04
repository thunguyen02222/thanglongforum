import { apiRequest } from './api-request';

class NotificationServiceAdmin {
  async sendSystem(message: string, targetRole?: string): Promise<any> {
    return apiRequest.post('/admin/notifications/send-system', { message, targetRole });
  }

  async getBroadcasts(page = 1, limit = 20): Promise<any> {
    return apiRequest.get('/admin/notifications/broadcasts', { params: { page, limit } });
  }

  async deleteBroadcast(id: string): Promise<any> {
    return apiRequest.delete(`/admin/notifications/broadcasts/${id}`);
  }
}

export const notificationServiceAdmin = new NotificationServiceAdmin();
