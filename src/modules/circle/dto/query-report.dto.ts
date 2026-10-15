/**
 * 举报分页查询 DTO — 后台
 */
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryReportDto extends PaginationDto {
  /** 状态：0待处理 1处罚 2驳回 */
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  status?: number;

  /** 目标类型：1帖 2评 3活动 4教练 5场馆 6评价 */
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(6)
  @Type(() => Number)
  targetType?: number;
}
