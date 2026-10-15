import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建/更新消息模板 DTO
 * channel: 1小程序订阅消息 2公众号模板消息 3短信
 */
export class CreateTemplateDto {
  @IsString()
  @MaxLength(64)
  code: string;

  @IsInt()
  @IsIn([1, 2, 3])
  @Type(() => Number)
  channel: number;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  platformTemplateId?: string;

  @IsString()
  @MaxLength(128)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  example?: string;

  /** 创建时默认 status=1 启用；更新时如需停用通过 status 接口 */
  @IsInt()
  @IsIn([0, 1])
  @IsOptional()
  @Type(() => Number)
  status?: number;
}
