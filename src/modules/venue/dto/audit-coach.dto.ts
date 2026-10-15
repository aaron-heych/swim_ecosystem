import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditCoachDto {
  /** 审核状态：1通过 2驳回 */
  @IsInt()
  @Min(1)
  @Max(2)
  @Type(() => Number)
  auditStatus: number;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  auditRemark?: string;
}

export class UpdateCoachStatusDto {
  /** 上架状态：0下架 1上架 */
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status: number;
}

export class UpdateCourseStatusDto {
  /** 0下架 1在售 */
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status: number;
}

export class ReplyReviewDto {
  @IsString()
  @Length(1, 500)
  reply: string;
}
