/**
 * 反馈分页查询 DTO
 */
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryFeedbackDto extends PaginationDto {
  /** 状态：0待处理 1已回复 2已关闭 */
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  status?: number;

  /** 类型：1建议 2问题 3投诉 4其他 */
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  type?: number;
}
