import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 从协会会员批量导入参与人员
 */
export class ImportMembersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  memberIds: number[];
}

/**
 * 编辑参与人员（局部更新）
 */
export class UpdateParticipantDto {
  @IsString()
  @IsOptional()
  @MaxLength(32)
  realName?: string;

  /** 性别：0未知 1男 2女 */
  @IsInt()
  @IsIn([0, 1, 2])
  @IsOptional()
  @Type(() => Number)
  gender?: number;

  @IsString()
  @IsOptional()
  birthday?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  /** 身份证号明文（传入时后端加密存储） */
  @IsString()
  @IsOptional()
  idCard?: string;

  @IsString()
  @IsOptional()
  @MaxLength(16)
  bibNo?: string;

  /** 状态：0取消 1有效 */
  @IsInt()
  @IsIn([0, 1])
  @IsOptional()
  @Type(() => Number)
  status?: number;
}
