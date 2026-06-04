import { useState } from 'react';
import { fileService } from '@services/file.service';

export function useUploadFile() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File, type = 'image') => {
    setUploading(true);
    setProgress(0);

    try {
      const result = await fileService.upload(file, type);
      setProgress(100);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    upload,
    uploading,
    progress
  };
}
