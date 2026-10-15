/**
 * 发帖 DTO — C 端创建帖子主表
 * type 决定是否需要带上对应扩展表数据：
 *   1 代刷卡 → 携带 cardShare 字段
 *   2 约搭子 → 携带 buddyInvitation 字段
 *   3 组织活动 → 携带 activity 字段
 *   4 普通动态 → 无扩展
 */
import { IsInt, IsOptional, IsString, IsArray, ArrayNotEmpty, MaxLength, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCardShareDto } from './create-card-share.dto';
import { CreateBuddyDto } from './create-buddy.dto';
import { CreateActivityDto } from './create-activity.dto';

export class CreatePostDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  type: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsString()
  @MaxLength(2000)
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  venueId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  province?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  locationName?: string;

  // ---- 扩展表数据（按 type 校验）----
  @IsOptional()
  cardShare?: CreateCardShareDto;

  @IsOptional()
  buddyInvitation?: CreateBuddyDto;

  @IsOptional()
  activity?: CreateActivityDto;
}
