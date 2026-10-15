/**
 * 举报 DTO — 多态目标
 */
import { IsInt, IsString, IsOptional, IsArray, Min, Max, MaxLength } from 'class-validator';

export class CreateReportDto {
  /** 目标类型：1帖 2评 3活动 4教练 5场馆 6评价 */
  @IsInt()
  @Min(1)
  @Max(6)
  targetType: number;

  @IsInt()
  @Min(1)
  targetId: number;

  /** 举报原因类型：1欺诈 2违规广告 3色情低俗 4人身攻击 5虚假信息 9其他 */
  @IsInt()
  @Min(1)
  @Max(9)
  reasonType: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reasonDetail?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
