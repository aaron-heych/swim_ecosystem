import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @Length(1, 200)
  title: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  /** 项目类型 */
  @IsString()
  @IsOptional()
  eventType?: string;

  /** 赛事级别：1国际 2全国 3省级 4市级 5民间 */
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  level?: number;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  venueName?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  /** YYYY-MM-DD */
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  registerStart?: Date;

  @IsDateString()
  @IsOptional()
  registerEnd?: Date;

  @IsString()
  @IsOptional()
  registerUrl?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  feeMin?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  feeMax?: number;

  /** 赛事规程/详情（富文本 HTML） */
  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateEventDto extends CreateEventDto {}

export class UpdateEventStatusDto {
  /** 赛事状态：0草稿 1报名中 2报名截止 3已结束 4已取消 */
  @IsInt()
  @Min(0)
  @Max(4)
  @Type(() => Number)
  status: number;
}

export class AuditEventDto {
  /** 审核状态：1通过 2驳回 */
  @IsInt()
  @Min(1)
  @Max(2)
  @Type(() => Number)
  auditStatus: number;
}

export class UpdateEventHotDto {
  /** 是否热门：0否 1是 */
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  isHot: number;
}
