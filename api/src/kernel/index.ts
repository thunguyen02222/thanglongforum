import { join } from 'path';

export * from './infras';
export * from './exceptions';
export { Event as KernelEvent, QueueEvent as KernelQueueEvent } from './events';
export * from './models';
export * from './helpers';
export * from './common';

export function getConfig(configName = 'app') {
  return require(join(__dirname, '..', 'config', configName)).default;
}

