import { DynamicModule, Global, Module } from '@nestjs/common';
import { QUEUE_CONFIG, QUEUE_SERVICE } from './constants';
import { QueueService } from './queue.service';

interface QueueModuleOptions {
  redisConfig: any;
  useRedisCluster: boolean;
}

interface QueueModuleAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => Promise<QueueModuleOptions> | QueueModuleOptions;
  inject?: any[];
}

@Global()
@Module({})
export class CoreQueueModule {
  static registerAsync(options: QueueModuleAsyncOptions): DynamicModule {
    return {
      module: CoreQueueModule,
      imports: options.imports || [],
      providers: [
        {
          provide: QUEUE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || []
        },
        {
          provide: QUEUE_SERVICE,
          useClass: QueueService
        },
        QueueService
      ],
      exports: [QUEUE_CONFIG, QUEUE_SERVICE, QueueService]
    };
  }
}

