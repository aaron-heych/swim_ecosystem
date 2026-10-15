/**
 * C 端访问量明细查询 DTO（分页 + 多维度筛选）
 */
import { IsInt, IsOptional, IsString, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryAccessStatDetailDto extends PaginationDto {
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

  /** 排序字段：stat_date / count（默认 stat_date） */
  @IsString()
  @IsOptional()
  sortField?: string;

  /** 排序方向：ASC / DESC（默认 DESC） */
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}
