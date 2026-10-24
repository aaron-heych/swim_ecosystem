import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  Length,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateRegionDto {
  @IsString()
  @Length(2, 9)
  @Matches(/^\d+$/)
  @ValidateIf((_object, value) => value !== undefined)
  code?: string;

  @IsString()
  @Length(1, 64)
  @ValidateIf((_object, value) => value !== undefined)
  name?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ValidateIf((_object, value) => value !== undefined)
  sort?: number;

  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  @ValidateIf((_object, value) => value !== undefined)
  status?: number;
}
