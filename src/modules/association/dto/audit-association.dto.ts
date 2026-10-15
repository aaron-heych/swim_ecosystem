import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 协会审核 DTO（后台）
 * auditStatus: 1通过 / 2驳回
 */
export class AuditAssociationDto {
  @IsInt()
  @IsIn([1, 2], { message: 'auditStatus 仅支持 1通过 2驳回' })
  @Type(() => Number)
  auditStatus: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  auditRemark?: string;
}
