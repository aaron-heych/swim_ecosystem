/**
 * 帖子分页查询 DTO — C 端 Feed 流 + 后台审核列表共用
 */
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryPostDto extends PaginationDto {
  /** 帖子类型：1代刷卡 2约搭子 3组织活动 4普通动态 */
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  type?: number;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  /** 状态过滤（后台用），C 端默认 1 正常 */
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(4)
  @Type(() => Number)
  status?: number;

  /** 按 userId 过滤（我的帖子 / 后台按用户过滤） */
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  userId?: number;
}
