import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @IsInt()
  @Type(() => Number)
  coachId: number;

  @IsString()
  @Length(1, 100)
  name: string;

  /** 类型：1一对一 2一对多 3小班课 4课时包 */
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  @Type(() => Number)
  type?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  sessions?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  durationMin?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  originalPrice?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  status?: number;
}

export class UpdateCourseDto extends CreateCourseDto {}
