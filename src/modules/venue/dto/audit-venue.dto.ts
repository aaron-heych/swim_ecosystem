import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditVenueDto {
  /** 审核状态：1通过 2驳回 */
  @IsInt()
  @Min(1)
  @Max(2)
  @Type(() => Number)
  auditStatus: number;

  @IsString()
  @IsOptional()
  auditRemark?: string;
}

export class UpdateVenueStatusDto {
  /** 状态：0停业/下架 1正常 */
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status: number;
}
