import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/**
 * 绑定手机号。
 * - 方式一：微信 getPhoneNumber 解密后的纯手机号（仅传 phone）
 * - 方式二：短信验证码方式（phone + smsHash）
 */
export class BindPhoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/)
  phone: string;

  /** 验证码哈希（短信方式时必传） */
  @IsOptional()
  @IsString()
  smsHash?: string;
}
