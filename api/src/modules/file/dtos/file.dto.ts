import { Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { File } from '../schemas/file.schema';
import { Storage } from '../constants';
import { getConfig } from 'src/kernel';
import { isUrl } from 'src/kernel/helpers/string.helper';

export class FileDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  type: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  mimeType: string;

  @Expose()
  server: string;

  @Expose()
  path: string;

  @Expose()
  absolutePath: string;

  @Expose()
  width: number;

  @Expose()
  height: number;

  @Expose()
  size: number;

  @Expose()
  status: string;

  @Expose()
  acl: string;

  @Expose()
  @Transform(({ obj }) => obj.metadata)
  metadata: Record<string, any>;

  @Expose()
  @Transform(({ obj }) => obj.thumbnailPath)
  thumbnailPath: string;

  @Expose()
  @Transform(({ obj }) => obj.thumbnailAbsolutePath)
  thumbnailAbsolutePath: string;

  @Expose()
  @Transform(({ obj }) => obj.createdBy)
  createdBy: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.updatedBy)
  updatedBy: ObjectId;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(init?: any) {
    if (init) {
      this._id = init._id;
      this.type = init.type;
      this.name = init.name;
      this.description = init.description;
      this.mimeType = init.mimeType;
      this.server = init.server;
      this.path = init.path;
      this.width = init.width;
      this.height = init.height;
      this.size = init.size;
      this.path = init.path;
      this.absolutePath = init.absolutePath;
      this.status = init.status;
      this.acl = init.acl;
      this.metadata = init.metadata;
      this.thumbnailPath = init.thumbnailPath;
      this.thumbnailAbsolutePath = init.thumbnailAbsolutePath;
      this.createdBy = init.createdBy;
      this.updatedBy = init.updatedBy;
      this.createdAt = init.createdAt;
      this.updatedAt = init.updatedAt;
    }
  }

  static fromModel(file: File) {
    return new FileDto(file);
  }

  public getPublicPath() {
    if (this.absolutePath) {
      const { publicDir, publicPath } = getConfig('file');
      let webPath = this.absolutePath;

      const normalizedPublicDir = publicDir.replace(/\\/g, '/');
      const normalizedAbsolutePath = webPath.replace(/\\/g, '/');

      if (normalizedAbsolutePath.includes(normalizedPublicDir)) {
        const publicDirIndex = normalizedAbsolutePath.indexOf(normalizedPublicDir);
        const pathAfterPublic = normalizedAbsolutePath.substring(
          publicDirIndex + normalizedPublicDir.length
        );

        webPath = `${publicPath}${pathAfterPublic.startsWith('/') ? pathAfterPublic : `/${pathAfterPublic}`}`;
      } else if (!webPath.startsWith('/public')) {
        webPath = webPath.replace(/\\/g, '/');
        webPath = `/public${webPath.startsWith('/') ? webPath : `/${webPath}`}`;
      }

      return webPath;
    }

    return this.path || '';
  }

  public getUrl(): string {
    if (this.server === Storage.DiskStorage || !this.server) {
      const publicPath = this.getPublicPath();
      const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
      return `${baseUrl}${publicPath}`;
    }

    return this.absolutePath || this.path || '';
  }

  public getThumbnailUrl(): string {
    if (!this.thumbnailPath) {
      return '';
    }

    if (this.server === Storage.DiskStorage || !this.server) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
      return `${baseUrl}${this.thumbnailPath}`;
    }

    return this.thumbnailAbsolutePath || this.thumbnailPath || '';
  }

  static getPublicUrl(filePath: string): string {
    if (!filePath) return '';
    if (isUrl(filePath)) return filePath;
    return new URL(filePath, process.env.BASE_URL).href;
  }

  public isVideo() {
    return (
      (this.mimeType || '').toLowerCase().includes('video') ||
      this.name.toLowerCase().endsWith('.hevc')
    );
  }

  public isImage() {
    return (
      (this.mimeType || '').toLowerCase().includes('image') ||
      this.name.toLowerCase().endsWith('.heic') ||
      this.name.toLowerCase().endsWith('.heif')
    );
  }

  public toPublicResponse() {
    return {
      _id: this._id,
      type: this.type || this.mimeType,
      name: this.name,
      mimeType: this.mimeType,
      width: this.width,
      height: this.height,
      url: this.getUrl(),
      thumbnailUrl: this.getThumbnailUrl() || undefined,
      status: this.status,
      metadata: this.metadata
    };
  }
}

