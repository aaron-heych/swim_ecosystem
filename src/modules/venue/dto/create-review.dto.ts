import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  /** 二选一：优先 appointmentId */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  appointmentId?: number;

  @IsString()
  @IsOptional()
  orderNo?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  scoreProfessional: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  scoreAttitude: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  scorePunctual: number;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  content?: string;

  @IsArray()
  @ArrayMaxSize(9)
  @IsOptional()
  images?: string[];
}
