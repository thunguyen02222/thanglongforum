import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { existsSync, unlinkSync } from 'fs';
import { File } from '../schemas/file.schema';
import { FileDto } from '../dtos/file.dto';
import { getConfig } from 'src/kernel';
import { VideoThumbnailService } from './video-thumbnail.service';
import { logError } from 'src/lib';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

@Injectable()
export class FileService {
  constructor(
    @InjectModel(File.name) private readonly fileModel: Model<File>,
    private readonly videoThumbnailService: VideoThumbnailService
  ) {}

  async createFromUpload(type: string, file: MulterFile, uploader?: any): Promise<FileDto> {
    try {
      const { publicDir, publicPath } = getConfig('file');

      let relativePath = file.path.replace(/\\/g, '/');
      const normalizedPublicDir = publicDir.replace(/\\/g, '/');

      if (relativePath.includes(normalizedPublicDir)) {
        const publicDirIndex = relativePath.indexOf(normalizedPublicDir);
        const pathAfterPublic = relativePath.substring(publicDirIndex + normalizedPublicDir.length);
        relativePath = `${publicPath}${pathAfterPublic.startsWith('/') ? pathAfterPublic : `/${pathAfterPublic}`}`;
      } else if (!relativePath.startsWith('/public')) {
        relativePath = `/public${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
      }

      const typeMap: Record<string, string> = {
        avatar: 'avatar-image',
        inventory: 'inventory-image',
        cover: 'cover-image',
        gallery: 'gallery-image',
        video: 'video-file'
      };

      let thumbnailPath = '';
      let thumbnailAbsolutePath = '';
      const isVideo = file.mimetype?.startsWith('video/');

      if (isVideo) {
        try {
          thumbnailAbsolutePath = await this.videoThumbnailService.generateThumbnail(file.path);
          thumbnailPath = this.videoThumbnailService.getThumbnailRelativePath(thumbnailAbsolutePath);
        } catch (error) {
          console.warn(
            `Failed to generate thumbnail for video ${file.originalname}: ${(error as Error).message}`
          );
        }
      }

      const fileData = {
        name: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        type: typeMap[type] || 'other',
        path: relativePath,
        absolutePath: file.path,
        publicUrl: relativePath,
        server: 'diskStorage',
        size: file.size,
        thumbnailPath: thumbnailPath,
        thumbnailAbsolutePath: thumbnailAbsolutePath,
        uploadedBy: uploader?._id || uploader?.id,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const createdFile = await this.fileModel.create(fileData);
      return new FileDto(createdFile);
    } catch (error) {
      console.error('FileService.createFromUpload', error);
      throw new BadRequestException(`Failed to create file record: ${(error as Error).message}`);
    }
  }

  async getById(id: string): Promise<FileDto | null> {
    try {
      const file = await this.fileModel.findById(id);
      return file ? new FileDto(file) : null;
    } catch (error) {
      console.error('FileService.getById', error);
      return null;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const file = await this.fileModel.findByIdAndDelete(id);
      if (file) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('FileService.deleteById', error);
      return false;
    }
  }

  async createFromMulter(type: string, file: MulterFile, options?: any): Promise<FileDto> {
    try {
      const { publicDir, publicPath } = getConfig('file');

      let relativePath = file.path.replace(/\\/g, '/');
      const normalizedPublicDir = publicDir.replace(/\\/g, '/');

      if (relativePath.includes(normalizedPublicDir)) {
        const publicDirIndex = relativePath.indexOf(normalizedPublicDir);
        const pathAfterPublic = relativePath.substring(publicDirIndex + normalizedPublicDir.length);
        relativePath = `${publicPath}${pathAfterPublic.startsWith('/') ? pathAfterPublic : `/${pathAfterPublic}`}`;
      } else if (!relativePath.startsWith('/public')) {
        relativePath = `/public${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
      }

      const typeMap: Record<string, string> = {
        avatar: 'avatar-image',
        inventory: 'inventory-image',
        cover: 'cover-image',
        gallery: 'gallery-image',
        video: 'video-file',
        document: 'document'
      };

      let thumbnailPath = '';
      let thumbnailAbsolutePath = '';
      const isVideo = file.mimetype?.startsWith('video/');

      if (isVideo) {
        try {
          thumbnailAbsolutePath = await this.videoThumbnailService.generateThumbnail(file.path);
          thumbnailPath = this.videoThumbnailService.getThumbnailRelativePath(thumbnailAbsolutePath);
        } catch (error) {
          console.warn(
            `Failed to generate thumbnail for video ${file.originalname}: ${(error as Error).message}`
          );
        }
      }

      const fileData = {
        name: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        type: typeMap[type] || 'other',
        path: relativePath,
        absolutePath: file.path,
        publicUrl: relativePath,
        server: 'diskStorage',
        size: file.size,
        thumbnailPath: thumbnailPath,
        thumbnailAbsolutePath: thumbnailAbsolutePath,
        uploadedBy: options?.uploadedBy || options?._id || options?.id,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const createdFile = await this.fileModel.create(fileData);
      return new FileDto(createdFile);
    } catch (error) {
      console.error('FileService.createFromMulter', error);
      throw new BadRequestException(`Failed to create file record: ${(error as Error).message}`);
    }
  }

  async findByIdAsFileDto(id: string): Promise<FileDto | null> {
    try {
      const file = await this.fileModel.findById(id);
      return file ? new FileDto(file) : null;
    } catch (error) {
      console.error('FileService.findByIdAsFileDto', error);
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<FileDto[]> {
    try {
      const files = await this.fileModel.find({ _id: { $in: ids } });
      return files.map((f) => new FileDto(f));
    } catch (error) {
      console.error('FileService.findByIds', error);
      return [];
    }
  }

  async findByPath(path: string): Promise<FileDto[]> {
    try {
      const files = await this.fileModel.find({ path: path });
      return files.map((f) => new FileDto(f));
    } catch (error) {
      console.error('FileService.findByPath', error);
      return [];
    }
  }

  async deleteFile(id: string): Promise<boolean> {
    try {
      const file = await this.fileModel.findByIdAndDelete(id);
      if (file) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('FileService.deleteFile', error);
      return false;
    }
  }

  async createMultipleFromMulter(type: string, files: MulterFile[], options?: any): Promise<any> {
    try {
      const { publicDir, publicPath } = getConfig('file');
      const typeMap: Record<string, string> = {
        avatar: 'avatar-image',
        inventory: 'inventory-image',
        cover: 'cover-image',
        gallery: 'gallery-image',
        video: 'video-file'
      };

      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          let relativePath = file.path.replace(/\\/g, '/');
          const normalizedPublicDir = publicDir.replace(/\\/g, '/');

          if (relativePath.includes(normalizedPublicDir)) {
            const publicDirIndex = relativePath.indexOf(normalizedPublicDir);
            const pathAfterPublic = relativePath.substring(
              publicDirIndex + normalizedPublicDir.length
            );
            relativePath = `${publicPath}${pathAfterPublic.startsWith('/') ? pathAfterPublic : `/${pathAfterPublic}`}`;
          } else if (!relativePath.startsWith('/public')) {
            relativePath = `/public${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
          }

          let thumbnailPath = '';
          let thumbnailAbsolutePath = '';
          const isVideo = file.mimetype?.startsWith('video/');

          if (isVideo) {
            try {
              thumbnailAbsolutePath =
                await this.videoThumbnailService.generateThumbnail(file.path);
              thumbnailPath =
                this.videoThumbnailService.getThumbnailRelativePath(thumbnailAbsolutePath);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.warn(
                `Failed to generate thumbnail for video ${file.originalname}: ${errorMessage}`
              );
            }
          }

          const fileData = {
            name: file.originalname,
            fileName: file.filename,
            mimeType: file.mimetype,
            type: typeMap[type] || 'other',
            path: relativePath,
            absolutePath: file.path,
            publicUrl: relativePath,
            server: 'diskStorage',
            size: file.size,
            thumbnailPath: thumbnailPath,
            thumbnailAbsolutePath: thumbnailAbsolutePath,
            uploadedBy: options?.uploadedBy || options?._id || options?.id,
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const createdFile = await this.fileModel.create(fileData);
          return new FileDto(createdFile);
        })
      );

      return {
        success: true,
        files: uploadedFiles,
        totalFiles: uploadedFiles.length
      };
    } catch (error) {
      console.error('FileService.createMultipleFromMulter', error);
      throw new BadRequestException(`Failed to upload multiple files: ${(error as Error).message}`);
    }
  }

  private deleteFileFromDisk(filePath: string): boolean {
    try {
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (e) {
      logError('deleteFileFromDisk', e);
      return false;
    }
  }

  private async deleteFileRecord(fileId: ObjectId | string): Promise<boolean> {
    try {
      await this.fileModel.deleteOne({ _id: fileId });
      return true;
    } catch (e) {
      logError('deleteFileRecord', e);
      return false;
    }
  }

  private async deleteFileAssets(file: any): Promise<void> {
    try {
      if (file.absolutePath) {
        this.deleteFileFromDisk(file.absolutePath);
      }
      if (file.thumbnailAbsolutePath) {
        this.deleteFileFromDisk(file.thumbnailAbsolutePath);
      }
    } catch (e) {
      logError('deleteFileAssets', e);
    }
  }

  public async remove(fileId: string | ObjectId): Promise<boolean> {
    try {
      const file = await this.fileModel.findById(fileId).lean();
      if (!file || !file._id) return false;

      await Promise.all([this.deleteFileRecord(file._id), this.deleteFileAssets(file)]);

      return true;
    } catch (e) {
      logError('FileService.remove', e);
      return false;
    }
  }

  public async removeMany(fileIds: string[] | ObjectId[]): Promise<boolean> {
    try {
      const files = await this.fileModel.find({ _id: { $in: fileIds } }).lean();
      if (!files?.length) return false;

      await Promise.all(
        files.map(async (file) => {
          await Promise.all([this.deleteFileRecord(file._id), this.deleteFileAssets(file)]);
        })
      );

      return true;
    } catch (e) {
      logError('FileService.removeMany', e);
      return false;
    }
  }
}
