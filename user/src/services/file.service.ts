import { apiRequest } from './api-request';

class FileService {
  async uploadAvatar(file: File): Promise<{ _id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiRequest.post('/files/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return (response as any).data;
  }

  async uploadImage(file: File): Promise<{ _id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiRequest.post('/files/upload?type=image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return (response as any).data;
  }

  async uploadFile(file: File, type = 'document'): Promise<{ _id: string; url: string; name: string; mimeType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiRequest.post(`/files/upload?type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return (response as any).data;
  }
}

export const fileService = new FileService();
