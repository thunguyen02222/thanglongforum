import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_CONFIG } from './constants';

@Injectable()
export class QueueService implements OnModuleInit {
  private queues: Map<string, Queue> = new Map();

  constructor(
    @Inject(QUEUE_CONFIG)
    private readonly queueConfig: { redisConfig: any; useRedisCluster: boolean }
  ) {}

  async onModuleInit() {
    // Initialize queues if needed
  }

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.queueConfig.redisConfig
      });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  async addJob(queueName: string, jobName: string, data: any, options?: any) {
    const queue = this.getQueue(queueName);
    return queue.add(jobName, data, options);
  }
}

