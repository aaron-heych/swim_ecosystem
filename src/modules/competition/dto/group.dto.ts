import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

/**
 * 赛事项目/组别
 */
export class CreateCompetitionGroupDto {
  @IsString()
  @MaxLength(100)
  name: string;

  /** 性别要求：0不限 1男 2女 */
  @IsInt()
  @IsIn([0, 1, 2])
  @IsOptional()
  @Type(() => Number)
  genderLimit?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  ageMin?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  ageMax?: number;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  stroke?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  distanceM?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sort?: number;
}

export class UpdateCompetitionGroupDto extends PartialType(
  CreateCompetitionGroupDto,
) {}
