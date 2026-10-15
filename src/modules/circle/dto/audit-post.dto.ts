/**
 * 帖子审核 DTO — 后台
 */
import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditPostDto {
  /** 审核状态：1正常 2驳回 */
  @IsInt()
  @Min(1)
  @Max(2)
  @Type(() => Number)
  status: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  auditRemark?: string;
}
