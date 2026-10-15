import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** 更新管理员基本信息（不含密码 / 角色 / 状态） */
export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  realName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 512)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6,20}$/)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @Length(0, 128)
  email?: string;
}
