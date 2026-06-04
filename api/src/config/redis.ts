const redisConfig = {
  type: process.env.REDIS_SERVER_TYPE || 'single',
  options: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: process.env.REDIS_PREFIX || undefined,
    tls: process.env.REDIS_TLS ? {} : undefined
  }
};

export default redisConfig;

export const registerAs = () => ({ redis: redisConfig });
