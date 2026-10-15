import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 用户报名入会 DTO
 * 对应 AssociationMember 创建（status=0 待审核，reviewerId/reviewedAt/joinedAt 留空）
 */
export class ApplyMemberDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  associationId: number;

  @IsString()
  @MaxLength(32)
  realName: string;

  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;

  /** 身份证号（明文，Service 层 AES 加密入库） */
  @IsString()
  @IsOptional()
  @MaxLength(18)
  idCard?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  emergencyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  emergencyPhone?: string;

  /** 冬泳健康声明 JSON */
  @IsObject()
  @IsOptional()
  healthDeclaration?: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  applyRemark?: string;
}
