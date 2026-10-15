import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 审核会员 DTO（后台）
 * status: 1通过 / 2拒绝
 * 通过时由 Service 自动生成 memberNo 并写入 reviewerId + reviewedAt + joinedAt
 */
export class AuditMemberDto {
  @IsInt()
  @IsIn([1, 2], { message: 'status 仅支持 1通过 2拒绝' })
  @Type(() => Number)
  status: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  reviewRemark?: string;
}
