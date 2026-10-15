/**
 * 帖子评论 DTO — 楼中楼
 */
import { IsInt, IsString, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @MaxLength(1000)
  content: string;

  /** 父评论 ID，0 为一级评论 */
  @IsInt()
  @Min(0)
  @Type(() => Number)
  parentId: number = 0;

  /** 回复目标用户 ID（楼中楼回复时） */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  replyUserId?: number;
}
