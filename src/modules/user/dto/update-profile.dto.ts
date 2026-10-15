import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/** C 端用户更新资料 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  avatarUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  gender?: number;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  province?: string;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  district?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  @Type(() => Number)
  swimLevel?: number;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  emergencyName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6,20}$/)
  emergencyPhone?: string;

  /** YYYY-MM-DD */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthday?: string;
}
