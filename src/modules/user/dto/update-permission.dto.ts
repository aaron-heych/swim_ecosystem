import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** 更新权限（部分字段，code 不可改） */
export class UpdatePermissionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  parentId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  @Type(() => Number)
  type?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  path?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  component?: string;

  @IsOptional()
  @IsString()
  @Length(0, 64)
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sort?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status?: number;
}
