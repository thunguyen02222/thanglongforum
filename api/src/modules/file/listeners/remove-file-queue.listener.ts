import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { EVENT } from 'src/kernel/constants';
import { logError, logData } from 'src/lib';
import { QUEUE_CONFIG } from 'src/kernel/infras/queue/constants';
import { REMOVE_FILE_QUEUE_CHANNEL, REMOVE_MANY_FILE_QUEUE_CHANNEL } from '../constants';
import { FileService } from '../services';

export interface QueueEventData {
  eventName: string;
  data: {
    fileId?: string;
    fileIds?: string[];
  };
}

@Injectable()
export class RemoveFileQueueListener {
  private removeFileWorker: Worker | null = null;
  private removeManyFileWorker: Worker | null = null;

  constructor(
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(QUEUE_CONFIG)
    private readonly queueConfig: { redisConfig: any }
  ) {
    this.initWorkers();
  }

  private initWorkers() {
    try {
      this.removeFileWorker = new Worker(
        REMOVE_FILE_QUEUE_CHANNEL,
        async (job: Job<QueueEventData>) => {
          await this.handleRemoveFile(job);
        },
        {
          connection: this.queueConfig.redisConfig,
          autorun: true
        }
      );

      this.removeManyFileWorker = new Worker(
        REMOVE_MANY_FILE_QUEUE_CHANNEL,
        async (job: Job<QueueEventData>) => {
          await this.handleRemoveManyFile(job);
        },
        {
          connection: this.queueConfig.redisConfig,
          autorun: true
        }
      );

      logData('RemoveFileQueueListener workers initialized');
    } catch (e) {
      logError('RemoveFileQueueListener.initWorkers', e);
    }
  }

  private async handleRemoveFile(job: Job<QueueEventData>): Promise<void> {
    try {
      const { eventName, data } = job.data;
      if (eventName !== EVENT.DELETED) return;

      const { fileId } = data;
      if (!fileId) return;

      await this.fileService.remove(fileId);
      logData(`File removed: ${fileId}`);
    } catch (e) {
      logError('handleRemoveFile', e);
    }
  }

  private async handleRemoveManyFile(job: Job<QueueEventData>): Promise<void> {
    try {
      const { eventName, data } = job.data;
      if (eventName !== EVENT.DELETED) return;

      const { fileIds } = data;
      if (!fileIds?.length) return;

      await this.fileService.removeMany(fileIds);
      logData(`Files removed: ${fileIds.length} files`);
    } catch (e) {
      logError('handleRemoveManyFile', e);
    }
  }

  async onModuleDestroy() {
    if (this.removeFileWorker) {
      await this.removeFileWorker.close();
    }
    if (this.removeManyFileWorker) {
      await this.removeManyFileWorker.close();
    }
  }
}

