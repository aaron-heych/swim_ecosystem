import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSourceDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @IsOptional()
  website?: string;

  /** 赛事公告列表页 URL */
  @IsString()
  @IsOptional()
  listUrl?: string;

  /** 解析方式：manual / cheerio / puppeteer / api */
  @IsString()
  @IsOptional()
  parserType?: string;

  /** 解析配置：选择器、分页、字段映射等 */
  @IsObject()
  @IsOptional()
  parserConfig?: Record<string, any>;

  /** 抓取频率（cron 表达式） */
  @IsString()
  @IsOptional()
  cronExpr?: string;

  /** 是否启用：0停用 1启用 */
  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  enabled?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateSourceDto extends CreateSourceDto {}

export class ToggleSourceDto {
  /** 是否启用：0停用 1启用 */
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  enabled: number;
}
