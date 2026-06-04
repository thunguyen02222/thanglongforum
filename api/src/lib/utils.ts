import { Logger } from '@nestjs/common';

const logger = new Logger('AppLogger');

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export async function logError(nameFunction: string, e: any) {
  const error = await e;
  logger.error('Error', nameFunction, error);
}

export async function logData(message?: any, ...optionalParams: any[]) {
  logger.log(message, ...optionalParams);
}

export async function logWarn(message?: any, ...optionalParams: any[]) {
  logger.warn(message, ...optionalParams);
}
