/**
 * 系统配置 创建 / 更新 DTO
 */
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateConfigDto {
  @IsString()
  @MaxLength(64)
  configGroup: string;

  @IsString()
  @MaxLength(128)
  configKey: string;

  @IsString()
  @IsOptional()
  configValue?: string;

  /** 值类型：string/number/boolean/json */
  @IsString()
  @IsOptional()
  @MaxLength(16)
  valueType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  remark?: string;
}
