import * as crypto from 'crypto';

/** 生成 6 位短信验证码 */
export function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** 验证码哈希（bcrypt 不可用时用 sha256 + 盐） */
export function hashSmsCode(code: string): string {
  const salt = process.env.SMS_SALT || 'swim-ecosystem-sms-salt';
  return crypto.createHmac('sha256', salt).update(code).digest('hex');
}

/** 校验验证码 */
export function verifySmsCode(code: string, hash: string): boolean {
  return hashSmsCode(code) === hash;
}
