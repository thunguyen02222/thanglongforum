import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  mixin,
  Type
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import * as multer from 'multer';
import * as path from 'path';
import { promises as fs } from 'fs';

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

interface MulterRequest {
  file?: MulterFile;
}

export interface SimpleUploadOptions {
  destination?: string;
  maxFileSize?: number;
  fieldName?: string;
}

export function UploadFileInterceptor(options: SimpleUploadOptions = {}): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private readonly uploadDir: string;
    private readonly maxFileSize: number;
    private readonly fieldName: string;

    constructor(public readonly configService: ConfigService) {
      this.uploadDir =
        options.destination || this.configService.get<string>('file.publicDir') || 'public';
      this.maxFileSize = options.maxFileSize || 500 * 1024 * 1024; // 500MB default
      this.fieldName = options.fieldName || 'file';
      this.createFolderIfNotExists(this.uploadDir);
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest<MulterRequest>();

      try {
        const multerOptions = this.createMulterOptions();
        const upload = multer(multerOptions);
        const uploadHandler = upload.single(this.fieldName);

        await new Promise<void>((resolve, reject) => {
          uploadHandler(request, {} as any, (error: any) => {
            if (error) {
              console.error('UploadFileInterceptor.uploadHandler', error);
              reject(new BadRequestException(`Upload failed: ${error.message}`));
            } else {
              resolve();
            }
          });
        });

        if (request.file) {
          const originalPath = request.file.path;
          (request.file as any).originalPath = originalPath;
          (request.file as any).originalMimeType = request.file.mimetype;
          await this.convertFile(request.file);
        }

      } catch (error) {
        await this.cleanupOnError(request);
        throw error;
      }

      return next.handle();
    }

    private createMulterOptions(): multer.Options {
      const storage = multer.diskStorage({
        destination: async (req, file, cb) => {
          try {
            await this.createFolderIfNotExists(this.uploadDir);
            cb(null, this.uploadDir);
          } catch (error) {
            cb(error as Error, '');
          }
        },
        filename: (req, file, cb) => {
          try {
            const originalExt = path.extname(file.originalname).toLowerCase();
            const baseName = path
              .basename(file.originalname, originalExt)
              .replace(/[^a-zA-Z0-9]/g, '_');
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);

            const filename = `${baseName}_${timestamp}_${randomSuffix}${originalExt}`;
            cb(null, filename);
          } catch (error) {
            cb(error as Error, '');
          }
        }
      });

      return {
        storage,
        limits: {
          fileSize: this.maxFileSize,
          files: 1,
          fieldSize: 500 * 1024 * 1024, // 500MB
          fields: 20
        },
        fileFilter: (req, file, cb) => {
          if (
            !this.isImage(file.mimetype) &&
            !this.isVideo(file.mimetype) &&
            !this.isDocument(file.mimetype)
          ) {
            return cb(new BadRequestException('Only image, video and document files are allowed'));
          }

          return cb(null, true);
        }
      };
    }

    private async convertFile(file: MulterFile): Promise<void> {
      // Giữ nguyên file gốc, không rename extension
    }

    private isImage(mimeType: string): boolean {
      return mimeType.startsWith('image/');
    }

    private isVideo(mimeType: string): boolean {
      return mimeType.startsWith('video/');
    }

    private isDocument(mimeType: string): boolean {
      const docTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
      ];
      return docTypes.includes(mimeType);
    }

    private async cleanupOnError(request: MulterRequest): Promise<void> {
      if (request.file) {
        try {
          await fs.unlink(request.file.path);
          console.log(`Cleaned up file on error: ${request.file.path}`);
        } catch (error) {
          console.warn(`Failed to cleanup file: ${request.file.path}`, (error as Error).message);
        }
      }
    }

    private async createFolderIfNotExists(dir: string): Promise<void> {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }
  }

  return mixin(MixinInterceptor);
}

