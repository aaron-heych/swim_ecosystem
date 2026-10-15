import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建/更新冬泳赛事 DTO
 */
export class CreateCompetitionDto {
  @IsString()
  @MaxLength(150)
  title: string;

  /** 赛事类型：1竞速赛 2畅游赛 3邀请赛 */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  type?: number;

  /** 赛事级别：1国际 2全国 3省级 4市级 5协会级 */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  level?: number;

  @IsString()
  @IsOptional()
  description?: string;

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
  @MaxLength(200)
  location?: string;

  /** 比赛开始时间（ISO/ yyyy-MM-dd HH:mm:ss） */
  @IsString()
  @IsOptional()
  startAt?: string;

  @IsString()
  @IsOptional()
  endAt?: string;

  @IsString()
  @IsOptional()
  regStartAt?: string;

  @IsString()
  @IsOptional()
  regEndAt?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  fee?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  capacity?: number;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  contactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  /** 状态：0草稿 1报名中 2比赛中 3已结束 4已取消（创建时忽略，编辑时可改） */
  @IsInt()
  @IsIn([0, 1, 2, 3, 4])
  @IsOptional()
  @Type(() => Number)
  status?: number;
}
