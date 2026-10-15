import * as crypto from 'crypto';

const ALGO = 'aes-256-cbc';
// 生产环境请通过环境变量注入：AES_SECRET（32 字节）
const SECRET =
  process.env.AES_SECRET || 'swim-ecosystem-aes-secret-key-32byte!!';

function getKey(): Buffer {
  return crypto.createHash('sha256').update(SECRET).digest();
}

/** AES-256-CBC 加密 */
export function aesEncrypt(plain: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${enc.toString('hex')}`;
}

/** AES-256-CBC 解密 */
export function aesDecrypt(cipherText: string): string {
  const [ivHex, dataHex] = cipherText.split(':');
  if (!ivHex || !dataHex) throw new Error('无效的密文');
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

/** 身份证号脱敏（用于展示） */
export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) return idCard;
  return idCard.slice(0, 4) + '********' + idCard.slice(-4);
}

/** 手机号脱敏 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}
