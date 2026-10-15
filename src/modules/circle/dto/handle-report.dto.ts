/**
 * 处理举报 DTO — 后台
 */
import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class HandleReportDto {
  /** 处理结果：1已处理-处罚 2已处理-驳回 */
  @IsInt()
  @Min(1)
  @Max(2)
  @Type(() => Number)
  status: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  handleRemark?: string;
}
