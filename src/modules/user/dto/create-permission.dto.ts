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

/** 创建权限 */
export class CreatePermissionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  parentId?: number;

  /** 类型：1菜单 2按钮 3接口 */
  @IsInt()
  @Min(1)
  @Max(3)
  @Type(() => Number)
  type: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name: string;

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
