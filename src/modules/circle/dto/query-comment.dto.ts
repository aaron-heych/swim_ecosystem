/**
 * 评论分页查询 DTO — 后台
 */
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCommentDto extends PaginationDto {
  /** 状态：0删除 1正常 */
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  postId?: number;
}
