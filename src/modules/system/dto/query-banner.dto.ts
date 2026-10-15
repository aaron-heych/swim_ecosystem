/**
 * Banner 分页查询 DTO
 */
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryBannerDto extends PaginationDto {
  /** 展示位：home/event/venue/circle */
  @IsString()
  @IsOptional()
  position?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status?: number;
}
