import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVenueDto {
  @IsString()
  @Length(1, 100)
  name: string;

  /** 类型：1室内恒温 2室内常温 3室外 4公开水域 */
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  type: number;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  /** 省名称（与 provinceCode 配对，service 也会按 code 反查覆盖） */
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
  @MaxLength(32)
  district?: string;

  /** 省行政区划编码（关联 regions.code，9 位以内） */
  @IsString()
  @IsOptional()
  @Length(2, 9)
  provinceCode?: string;

  @IsString()
  @IsOptional()
  @Length(2, 9)
  cityCode?: string;

  @IsString()
  @IsOptional()
  @Length(2, 9)
  districtCode?: string;

  @IsString()
  @Length(1, 255)
  address: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  businessHours?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  poolLengthM?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  laneCount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  waterTempMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  waterTempMax?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  depthMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  depthMax?: number;

  @IsArray()
  @IsOptional()
  facilities?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @IsString()
  @IsOptional()
  intro?: string;
}

export class UpdateVenueDto extends CreateVenueDto {}
