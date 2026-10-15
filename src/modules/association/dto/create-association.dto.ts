import {
  IsBoolean,
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

/**
 * 创建/更新协会 DTO
 * 对应 Association 实体的可写字段（不含审核/状态/统计冗余）
 */
export class CreateAssociationDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  shortName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  coverUrl?: string;

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

  /** 行政区划编码（可选，长度 2-9） */
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
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  contactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  wechat?: string;

  /** 教练员 */
  @IsString()
  @IsOptional()
  @MaxLength(32)
  coach?: string;

  @IsString()
  @IsOptional()
  establishDate?: string;

  @IsString()
  @IsOptional()
  intro?: string;
}
