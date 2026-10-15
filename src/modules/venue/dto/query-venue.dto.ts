import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryVenueDto extends PaginationDto {
  /** 场馆类型 */
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  @Type(() => Number)
  type?: number;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  status?: number;

  /** 审核状态过滤：后台用 */
  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  auditStatus?: number;

  /** 排序字段：rating 评分 / createdAt 创建时间 */
  @IsString()
  @IsOptional()
  sort?: 'rating' | 'createdAt';

  @IsString()
  @IsOptional()
  order?: 'ASC' | 'DESC';
}
