import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @IsInt()
  @Type(() => Number)
  coachId: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  courseId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  venueId?: number;

  /** 授课日期数组：YYYY-MM-DD */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  dates: string[];

  /** HH:mm:ss */
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  endTime: string;
}
