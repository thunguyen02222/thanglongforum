import { IFile, IFileUploadResponse } from '@interfaces/file';
import { apiRequest } from './api-request';

class FileService {
  async upload(file: File, type = 'image'): Promise<IFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return apiRequest.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async delete(id: string): Promise<void> {
    return apiRequest.delete(`/files/${id}`);
  }

  async findById(id: string): Promise<IFile> {
    return apiRequest.get(`/files/${id}`);
  }
}

export const fileService = new FileService();
