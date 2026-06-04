import appConfig, { registerAs as appRegisterAs } from './app';
import fileConfig, { registerAs as fileRegisterAs } from './file';
import imageConfig, { registerAs as imageRegisterAs } from './image';
import queueConfig, { registerAs as queueRegisterAs } from './queue';
import redisConfig, { registerAs as redisRegisterAs } from './redis';
import emailConfig, { registerAs as emailRegisterAs } from './email';

export default {
  app: appConfig,
  file: fileConfig,
  image: imageConfig,
  queue: queueConfig,
  redis: redisConfig,
  email: emailConfig
};

export {
  appConfig as app,
  fileConfig as file,
  imageConfig as image,
  queueConfig as queue,
  redisConfig as redis,
  emailConfig as email,
  appRegisterAs,
  fileRegisterAs,
  imageRegisterAs,
  queueRegisterAs,
  redisRegisterAs,
  emailRegisterAs
};
