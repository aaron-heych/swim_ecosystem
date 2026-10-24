import {
  ArrayNotEmpty,
  IsArray,
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

/** 创建管理员 */
export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 64)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  realName: string;

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

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status?: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  roleIds: number[];
}
