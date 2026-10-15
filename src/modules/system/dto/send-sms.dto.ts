/**
 * 发送短信验证码 DTO
 */
import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  /** 场景：login/bind/change_phone */
  @IsString()
  @IsOptional()
  @MaxLength(32)
  scene?: string;
}
