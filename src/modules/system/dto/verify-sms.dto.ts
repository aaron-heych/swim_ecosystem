/**
 * 校验短信验证码 DTO
 */
import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class VerifySmsDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsString()
  @MaxLength(8)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  scene?: string;
}
