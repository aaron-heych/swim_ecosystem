import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** C 端用户分页查询 */
export class QueryUserDto extends PaginationDto {
  /** 状态过滤：0禁用 1正常 2已删除，不传则不过滤 */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  status?: number;
}
