/**
 * 点赞 DTO — 多态目标（帖子/评论）
 */
import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class LikeDto {
  /** 目标类型：1帖子 2评论 */
  @IsInt()
  @Min(1)
  @Max(2)
  @Type(() => Number)
  targetType: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetId: number;
}
