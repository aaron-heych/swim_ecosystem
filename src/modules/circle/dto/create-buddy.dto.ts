/**
 * 约搭子扩展 DTO（type=2）
 */
import { IsInt, IsOptional, IsString, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBuddyDto {
  @IsNumber()
  @Type(() => Number)
  venueId: number;

  /** 约定开游时间 ISO 字符串 */
  @IsString()
  scheduleTime: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  durationMin?: number;

  /** 性别要求：0不限 1男 2女 */
  @IsInt()
  @Min(0)
  @Max(2)
  genderLimit: number;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  levelRequirement?: string;

  @IsInt()
  @Min(1)
  peopleNeeded: number;
}
