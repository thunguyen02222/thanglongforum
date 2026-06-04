import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_CONFIG } from 'src/kernel/infras/queue/constants';
import { EVENT } from 'src/kernel/constants';
import { logError, logData } from 'src/lib';
import { REMOVE_FILE_QUEUE_CHANNEL, REMOVE_MANY_FILE_QUEUE_CHANNEL } from '../constants';

@Injectable()
export class FileQueueService {
  private removeFileQueue: Queue;
  private removeManyFileQueue: Queue;

  constructor(
    @Inject(QUEUE_CONFIG)
    private readonly queueConfig: { redisConfig: any }
  ) {
    this.removeFileQueue = new Queue(REMOVE_FILE_QUEUE_CHANNEL, {
      connection: this.queueConfig.redisConfig,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { age: 3600, count: 10 }
      }
    });

    this.removeManyFileQueue = new Queue(REMOVE_MANY_FILE_QUEUE_CHANNEL, {
      connection: this.queueConfig.redisConfig,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { age: 3600, count: 10 }
      }
    });
  }

  async publishRemoveFile(fileId: string): Promise<void> {
    try {
      await this.removeFileQueue.add(EVENT.DELETED, {
        eventName: EVENT.DELETED,
        data: { fileId }
      });
      logData(`Published remove file event: ${fileId}`);
    } catch (e) {
      logError('FileQueueService.publishRemoveFile', e);
    }
  }

  async publishRemoveManyFiles(fileIds: string[]): Promise<void> {
    try {
      if (!fileIds?.length) return;

      await this.removeManyFileQueue.add(EVENT.DELETED, {
        eventName: EVENT.DELETED,
        data: { fileIds }
      });
      logData(`Published remove many files event: ${fileIds.length} files`);
    } catch (e) {
      logError('FileQueueService.publishRemoveManyFiles', e);
    }
  }
}

