const queueConfig = {
  REDIS_QUEUE_CONFIG: {
    host: process.env.REDIS_QUEUE_HOST || process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_QUEUE_PORT || process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_QUEUE_DB || '1', 10),
    username: process.env.REDIS_QUEUE_USERNAME || undefined,
    password: process.env.REDIS_QUEUE_PASSWORD || process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_QUEUE_TLS ? {} : undefined
  },
  REDIS_QUEUE_USE_CLUSTER_MODE: process.env.REDIS_QUEUE_USE_CLUSTER_MODE === 'true'
};

export default queueConfig;

export const registerAs = () => ({ queue: queueConfig });
