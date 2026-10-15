import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCoachDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @IsString()
  @Length(1, 32)
  name: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  gender?: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  wechat?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  venueId?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsOptional()
  certImages?: string[];

  @IsArray()
  @IsOptional()
  strokes?: string[];

  @IsArray()
  @IsOptional()
  teachTargets?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  experienceYears?: number;

  @IsString()
  @IsOptional()
  intro?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  lessonPrice?: number;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  status?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sort?: number;
}

export class UpdateCoachDto extends CreateCoachDto {}
