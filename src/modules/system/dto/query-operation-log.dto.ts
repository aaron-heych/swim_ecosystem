/**
 * 操作日志分页查询 DTO
 */
import { IsInt, IsOptional, IsString, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryOperationLogDto extends PaginationDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  adminId?: number;

  @IsString()
  @IsOptional()
  module?: string;

  @IsString()
  @IsOptional()
  action?: string;

  /** 0失败 1成功 */
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  status?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
