export interface IFileUploadResult {
  _id: string;
  type: string;
  name: string;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  status: string;
}

export interface IMultipleFileUploadResult {
  success: boolean;
  files: IFileUploadResult[];
  totalFiles: number;
}

