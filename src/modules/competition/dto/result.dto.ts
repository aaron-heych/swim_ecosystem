import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** 原始记录附件（上传接口返回的 name/url/size，可附说明） */
export class ResultAttachmentDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(300)
  url: string;

  /** 字节数 */
  @IsNumber()
  @IsOptional()
  size?: number;

  /** 类型：图片 / ZIP */
  @IsString()
  @IsOptional()
  @MaxLength(20)
  type?: string;

  /** 附件说明 */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  remark?: string;
}

/** 整体保存比赛结果附件（赛事级） */
export class SaveResultAttachmentsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ResultAttachmentDto)
  attachments: ResultAttachmentDto[];
}

/**
 * 个人成绩（手工录入）
 * 选择参赛人员时后端自动带出 所属协会/队伍/姓名
 */
export class CreateCompetitionResultDto {
  /** 项目/组别 */
  @IsInt()
  @Type(() => Number)
  groupId: number;

  /** 参与人员 ID（从赛事参赛人员中选择） */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  participantId?: number;

  /** 手工录入姓名（无 participantId 时使用） */
  @IsString()
  @IsOptional()
  @MaxLength(32)
  participantName?: string;

  /** 覆盖所属协会（一般由 participantId 自动带出） */
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  associationId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  teamName?: string;

  /** 名次 */
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  rank?: number;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  resultValue?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  resultMs?: number;

  /** 积分（不传则按名次自动计算） */
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  score?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  remark?: string;

  /** 原始记录附件（图片/zip，最多 10 个） */
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ResultAttachmentDto)
  @IsOptional()
  attachments?: ResultAttachmentDto[];
}
