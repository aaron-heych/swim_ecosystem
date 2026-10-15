import { IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 参与协会分页查询（按主体过滤）
 */
export class QueryParticipationDto extends PaginationDto {
  /** 1赛事 2活动 */
  @IsInt()
  @IsIn([1, 2])
  @Type(() => Number)
  targetType: number;

  @IsInt()
  @Type(() => Number)
  targetId: number;
}
