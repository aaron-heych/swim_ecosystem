/**
 * Banner 创建 / 更新 DTO
 */
import { IsInt, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBannerDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(512)
  imageUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  position?: string;

  /** 跳转类型：0不跳转 1站内 2赛事 3场馆 4H5 */
  @IsInt()
  @Min(0)
  @Max(4)
  @Type(() => Number)
  @IsOptional()
  linkType?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  linkValue?: string;

  @IsInt()
  @IsOptional()
  sort?: number;

  @IsString()
  @IsOptional()
  startAt?: string;

  @IsString()
  @IsOptional()
  endAt?: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  status?: number;
}
