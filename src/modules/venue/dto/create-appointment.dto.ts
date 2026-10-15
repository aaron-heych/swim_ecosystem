import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
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
  scheduleId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  venueId?: number;

  /** YYYY-MM-DD */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  appointmentDate: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  endTime: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  @Length(1, 32)
  contactName: string;

  @IsString()
  @Length(6, 20)
  contactPhone: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
