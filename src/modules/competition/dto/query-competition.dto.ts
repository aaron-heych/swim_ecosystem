import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 冬泳赛事分页查询 DTO（后台）
 */
export class QueryCompetitionDto extends PaginationDto {
  /** 关键词：赛事名称模糊搜索 */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  keyword?: string;

  /** 赛事类型：1竞速赛 2畅游赛 3邀请赛 */
  @IsInt()
  @IsIn([1, 2, 3])
  @IsOptional()
  @Type(() => Number)
  type?: number;

  /** 状态：0草稿 1报名中 2比赛中 3已结束 4已取消 */
  @IsInt()
  @IsIn([0, 1, 2, 3, 4])
  @IsOptional()
  @Type(() => Number)
  status?: number;
}
