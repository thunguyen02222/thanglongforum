export interface IFile {
  _id: string;
  name: string;
  type: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFileUploadResponse {
  file: IFile;
  url: string;
}
