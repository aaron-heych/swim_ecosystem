/**
 * C 端访问量统计查询 DTO
 */
import { IsInt, IsOptional, IsString, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAccessStatDto {
  /** 模块过滤：association/event/venue/coach/circle/user/system/notification */
  @IsString()
  @IsOptional()
  module?: string;

  /** 起始日期 YYYY-MM-DD */
  @IsDateString()
  @IsOptional()
  startDate?: string;

  /** 结束日期 YYYY-MM-DD */
  @IsDateString()
  @IsOptional()
  endDate?: string;

  /** 趋势天数（默认 7，最大 90） */
  @IsInt()
  @Min(1)
  @Max(90)
  @Type(() => Number)
  @IsOptional()
  days?: number;
}
