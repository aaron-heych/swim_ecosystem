import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateRegionDto {
  @IsString()
  @Length(2, 9)
  @Matches(/^\d+$/)
  code: string;

  @IsString()
  @Length(1, 64)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  level: number;

  @Type(() => Number)
  @IsInt()
  @ValidateIf((_object, value) => value !== undefined)
  @Min(1)
  parentId?: number;

  @Type(() => Number)
  @IsInt()
  @ValidateIf((_object, value) => value !== undefined)
  @Min(0)
  sort?: number;
}
