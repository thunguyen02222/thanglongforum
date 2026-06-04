import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { getConfig } from 'src/kernel';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpeg = require('fluent-ffmpeg');

@Injectable()
export class VideoThumbnailService {
  private async getVideoDimensions(
    videoPath: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (!videoStream || !videoStream.width || !videoStream.height) {
          reject(new Error('Could not determine video dimensions'));
          return;
        }

        resolve({
          width: videoStream.width,
          height: videoStream.height
        });
      });
    });
  }

  private calculateThumbnailSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number = 1280,
    maxHeight: number = 720
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }

    width = width % 2 === 0 ? width : width + 1;
    height = height % 2 === 0 ? height : height + 1;

    return { width, height };
  }

  async generateThumbnail(videoPath: string, outputDir?: string): Promise<string> {
    try {
      if (!existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      const { videoThumbDir } = getConfig('file');
      const thumbDir = outputDir || videoThumbDir;

      if (!existsSync(thumbDir)) {
        mkdirSync(thumbDir, { recursive: true });
      }

      const path = require('path');
      const videoName = path.basename(videoPath, path.extname(videoPath));
      const thumbnailName = `${videoName}_thumb_${Date.now()}.jpg`;
      const thumbnailPath = join(thumbDir, thumbnailName);
      let videoDimensions: { width: number; height: number };
      try {
        videoDimensions = await this.getVideoDimensions(videoPath);
        console.log(`Video dimensions: ${videoDimensions.width}x${videoDimensions.height}`);
      } catch (error) {
        console.warn(
          `Could not get video dimensions, using default: ${(error as Error).message}`
        );
        videoDimensions = { width: 1920, height: 1080 };
      }

      const thumbnailSize = this.calculateThumbnailSize(
        videoDimensions.width,
        videoDimensions.height,
        1280,
        720
      );

      console.log(`Thumbnail size: ${thumbnailSize.width}x${thumbnailSize.height}`);

      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: ['00:00:01'],
            filename: thumbnailName,
            folder: thumbDir,
            size: `${thumbnailSize.width}x${thumbnailSize.height}`
          })
          .on('end', () => {
            console.log(
              `Thumbnail generated: ${thumbnailPath} (${thumbnailSize.width}x${thumbnailSize.height})`
            );
            resolve(thumbnailPath);
          })
          .on('error', error => {
            console.error('VideoThumbnailService.generateThumbnail', error);
            reject(error);
          });
      });
    } catch (error) {
      console.error('VideoThumbnailService.generateThumbnail', error);
      throw error;
    }
  }

  getThumbnailRelativePath(absolutePath: string): string {
    const { publicDir, publicPath } = getConfig('file');
    let relativePath = absolutePath.replace(/\\/g, '/');
    const normalizedPublicDir = publicDir.replace(/\\/g, '/');

    if (relativePath.includes(normalizedPublicDir)) {
      const publicDirIndex = relativePath.indexOf(normalizedPublicDir);
      const pathAfterPublic = relativePath.substring(publicDirIndex + normalizedPublicDir.length);
      relativePath = `${publicPath}${pathAfterPublic.startsWith('/') ? pathAfterPublic : `/${pathAfterPublic}`}`;
    } else if (!relativePath.startsWith('/public')) {
      relativePath = `/public${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
    }

    return relativePath;
  }

  getThumbnailUrl(absolutePath: string): string {
    const relativePath = this.getThumbnailRelativePath(absolutePath);
    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    return `${baseUrl}${relativePath}`;
  }
}

