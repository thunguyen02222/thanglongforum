import { apiRequest } from './api-request';

class NotificationServiceFE {
  async getMyNotifications(params?: Record<string, any>): Promise<any> {
    return apiRequest.get('/notifications', { params });
  }

  async getUnreadCount(): Promise<{ data: { count: number } }> {
    return apiRequest.get('/notifications/unread-count');
  }

  async markAsRead(id: string): Promise<any> {
    return apiRequest.put(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<any> {
    return apiRequest.put('/notifications/read-all');
  }
}

export const notificationService = new NotificationServiceFE();
