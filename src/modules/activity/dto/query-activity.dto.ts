import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 冬泳活动分页查询 DTO（后台）
 */
export class QueryActivityDto extends PaginationDto {
  /** 关键词：活动名称模糊搜索 */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  keyword?: string;

  /** 活动类型：1畅游活动 2冬泳体验 3公益宣传 4交流活动 */
  @IsInt()
  @IsIn([1, 2, 3, 4])
  @IsOptional()
  @Type(() => Number)
  type?: number;

  /** 状态：0草稿 1已发布 2进行中 3已结束 4已取消 */
  @IsInt()
  @IsIn([0, 1, 2, 3, 4])
  @IsOptional()
  @Type(() => Number)
  status?: number;

  /** 活动开始日期范围 */
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  /** 组织方模糊搜索 */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  organizer?: string;
}
