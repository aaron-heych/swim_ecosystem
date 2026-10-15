import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 新增参与协会（代表队）
 */
export class CreateParticipationDto {
  /** 1赛事 2活动 */
  @IsInt()
  @IsIn([1, 2])
  @Type(() => Number)
  targetType: number;

  @IsInt()
  @Type(() => Number)
  targetId: number;

  /** 冬泳协会 ID（协会名由后端反查填充） */
  @IsInt()
  @Type(() => Number)
  associationId: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  teamName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  leaderName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  leaderPhone?: string;

  /** 状态：0待确认 1已确认 2已取消 */
  @IsInt()
  @IsIn([0, 1, 2])
  @IsOptional()
  @Type(() => Number)
  status?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  remark?: string;
}
