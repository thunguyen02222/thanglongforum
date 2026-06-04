import * as crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.CRYPTO_SECRET_KEY || '';

export function encrypt(data: any): string | any {
  if (!secretKey) return data;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const json = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(json, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch {
    return data;
  }
}

export function decrypt<T = any>(token: string): T {
  const [ivHex, tagHex, dataHex] = token.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

