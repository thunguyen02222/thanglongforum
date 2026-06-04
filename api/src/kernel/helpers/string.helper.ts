import * as crypto from 'crypto';

export function generateSalt(byteSize = 16): string {
  return crypto.randomBytes(byteSize).toString('base64');
}

export function encryptPassword(password: string, salt: string): string {
  const defaultIterations = 10000;
  const defaultKeyLength = 64;

  return crypto
    .pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength, 'sha1')
    .toString('base64');
}

export function generateRandomString(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isUrl(str: string): boolean {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

