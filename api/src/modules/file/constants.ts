export const FILE_TYPE = {
  AVATAR_PHOTO: 'avatar-photo',
  BANNER_PHOTO: 'banner-photo',
  INVENTORY_PHOTO: 'inventory-photo',
  DOCUMENT: 'document'
};

export interface BaseDir {
  dir: string;
  absoluteDir: string;
}

export const FILE_STATUSES = {
  CREATED: 'created',
  PROCESSING: 'processing',
  QUEUED: 'queued',
  FINISHED: 'finished',
  ERROR: 'error'
};

export enum Storage {
  DiskStorage = 'diskStorage',
  MemoryStorage = 'memoryStorage',
  S3 = 's3'
}

export const REMOVE_FILE_QUEUE_CHANNEL = 'REMOVE_FILE_QUEUE_CHANNEL';
export const REMOVE_MANY_FILE_QUEUE_CHANNEL = 'REMOVE_MANY_FILE_QUEUE_CHANNEL';

