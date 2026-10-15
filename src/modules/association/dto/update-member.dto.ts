import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 后台编辑会员 DTO（全字段可选，仅更新传入字段）
 * 身份证号为明文传入，Service 层 AES 加密入库
 */
export class UpdateMemberDto {
  /** 协会内角色：1会长 2管理员 3普通会员 */
  @IsInt()
  @IsIn([1, 2, 3])
  @IsOptional()
  @Type(() => Number)
  role?: number;

  @IsString()
  @MaxLength(32)
  @IsOptional()
  realName?: string;

  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  @IsOptional()
  phone?: string;

  /** 身份证号（明文，非空时重新加密） */
  @IsString()
  @MaxLength(18)
  @IsOptional()
  idCard?: string;

  @IsString()
  @MaxLength(32)
  @IsOptional()
  emergencyName?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  emergencyPhone?: string;

  /** 冬泳健康声明 JSON：{"heart_disease":0,"hypertension":0,...,"signed":1} */
  @IsObject()
  @IsOptional()
  healthDeclaration?: Record<string, any>;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  applyRemark?: string;

  /** 入会时间（YYYY-MM-DD） */
  @IsString()
  @IsOptional()
  joinedAt?: string;

  /** 是否购买保险：0未购买 1已购买 */
  @IsInt()
  @IsIn([0, 1])
  @IsOptional()
  @Type(() => Number)
  hasInsurance?: number;

  /** 购买保险时间（YYYY-MM-DD） */
  @IsString()
  @IsOptional()
  buyedInsuranceAt?: string;

  /** 保险开始时间（YYYY-MM-DD） */
  @IsString()
  @IsOptional()
  insuranceStartAt?: string;

  /** 保险结束时间（YYYY-MM-DD） */
  @IsString()
  @IsOptional()
  insuranceEndAt?: string;

  /** 会员头像 URL（更新到关联用户 avatar_url） */
  @IsString()
  @MaxLength(512)
  @IsOptional()
  avatar?: string;

  /** 性别：0未知 1男 2女（更新到关联用户 gender） */
  @IsInt()
  @IsIn([0, 1, 2])
  @IsOptional()
  @Type(() => Number)
  gender?: number;
}
