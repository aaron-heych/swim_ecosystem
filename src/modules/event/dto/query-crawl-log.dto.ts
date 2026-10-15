import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCrawlLogDto extends PaginationDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sourceId?: number;

  /** 触发方式：1定时任务 2手动触发 */
  @IsInt()
  @Min(1)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  triggerType?: number;

  /** 执行状态：0进行中 1成功 2失败 */
  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  status?: number;
}
