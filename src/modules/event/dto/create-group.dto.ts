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

export class CreateGroupDto {
  @IsString()
  @Length(1, 100)
  name: string;

  /** 性别要求：0不限 1男 2女 */
  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  genderLimit?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  ageMin?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  ageMax?: number;

  @IsString()
  @IsOptional()
  stroke?: string;

  /** 距离（米） */
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  distanceM?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fee?: number;

  /** 名额，0为不限 */
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  quota?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sort?: number;
}

export class UpdateGroupDto extends CreateGroupDto {}
