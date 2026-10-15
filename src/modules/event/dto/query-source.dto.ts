import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QuerySourceDto extends PaginationDto {
  /** 解析方式：manual / cheerio / puppeteer / api */
  @IsString()
  @IsOptional()
  parserType?: string;

  /** 是否启用：0停用 1启用 */
  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  enabled?: number;
}
