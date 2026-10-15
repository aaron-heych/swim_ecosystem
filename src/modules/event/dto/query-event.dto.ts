import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryEventDto extends PaginationDto {
  /** 项目类型 */
  @IsString()
  @IsOptional()
  eventType?: string;

  /** 赛事级别：1国际 2全国 3省级 4市级 5民间 */
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  level?: number;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  /** 赛事状态：0草稿 1报名中 2报名截止 3已结束 4已取消 */
  @IsInt()
  @Min(0)
  @Max(4)
  @IsOptional()
  @Type(() => Number)
  status?: number;

  /** 审核状态：0待审核 1通过 2驳回（后台用） */
  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  auditStatus?: number;

  /** 是否热门：0否 1是 */
  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  isHot?: number;
}
