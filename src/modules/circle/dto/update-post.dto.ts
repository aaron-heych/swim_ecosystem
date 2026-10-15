/**
 * 帖子更新 DTO — C 端编辑自己的帖子
 */
import { IsInt, IsOptional, IsString, IsArray, MaxLength, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  content?: string;

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
}
