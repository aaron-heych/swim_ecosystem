import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 协会分页查询 DTO（后台）
 * 支持按审核状态过滤 + 关键词搜索 name
 */
export class QueryAssociationDto extends PaginationDto {
  /** 审核状态：0待审核 1通过 2驳回；不传则全部 */
  @IsInt()
  @IsIn([0, 1, 2])
  @IsOptional()
  @Type(() => Number)
  auditStatus?: number;

  /** 业务状态：0停用 1正常；不传则全部 */
  @IsInt()
  @IsIn([0, 1])
  @IsOptional()
  @Type(() => Number)
  status?: number;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  /** 负责人姓名模糊搜索 */
  @IsString()
  @IsOptional()
  contactName?: string;

  /** 负责人电话模糊搜索 */
  @IsString()
  @IsOptional()
  contactPhone?: string;

  /** 协会成立日期范围（含起止日期） */
  @IsDateString()
  @IsOptional()
  establishStart?: string;

  @IsDateString()
  @IsOptional()
  establishEnd?: string;
}
