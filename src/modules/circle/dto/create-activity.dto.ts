/**
 * 组织活动扩展 DTO（type=3）
 */
import { IsInt, IsOptional, IsString, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  associationId?: number;

  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  coverUrl?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  venueId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsString()
  startTime: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  signupDeadline?: string;

  @IsInt()
  @Min(0)
  maxParticipants: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fee: number;

  /** 报名是否需要审核：0否 1是 */
  @IsInt()
  @Min(0)
  @Max(1)
  needAudit: number;

  @IsString()
  @IsOptional()
  intro?: string;
}
