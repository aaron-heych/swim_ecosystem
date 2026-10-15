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
 * 创建/更新冬泳活动 DTO
 */
export class CreateActivityDto {
  @IsString()
  @MaxLength(150)
  title: string;

  /** 活动类型：1畅游活动 2冬泳体验 3公益宣传 4交流活动 */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  type?: number;

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

  /** 活动开始时间 */
  @IsString()
  @IsOptional()
  startAt?: string;

  @IsString()
  @IsOptional()
  endAt?: string;

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

  /** 组织方 */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  organizer?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  contactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  /** 状态：0草稿 1已发布 2进行中 3已结束 4已取消（创建时忽略，编辑时可改） */
  @IsInt()
  @IsIn([0, 1, 2, 3, 4])
  @IsOptional()
  @Type(() => Number)
  status?: number;
}
