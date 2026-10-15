import {
  ArrayMinSize,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterEventItemDto {
  @IsInt()
  @Type(() => Number)
  groupId: number;

  @IsString()
  @Length(1, 32)
  participantName: string;

  /** 身份证号（明文，后端加密） */
  @IsString()
  @IsOptional()
  idCard?: string;

  /** 性别：0未知 1男 2女 */
  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  gender?: number;

  /** YYYY-MM-DD */
  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsString()
  @Matches(/^1\d{10}$/)
  @IsOptional()
  phone?: string;
}

export class RegisterEventDto {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegisterEventItemDto)
  items: RegisterEventItemDto[];

  @IsString()
  @Length(1, 32)
  contactName: string;

  @IsString()
  @Matches(/^1\d{10}$/)
  contactPhone: string;

  /** 团队/俱乐部名称 */
  @IsString()
  @IsOptional()
  teamName?: string;

  /** 身份证号（联系人，明文，后端加密） */
  @IsString()
  @IsOptional()
  idCard?: string;

  @IsString()
  @Length(1, 32)
  @IsOptional()
  emergencyName?: string;

  @IsString()
  @Matches(/^1\d{10}$/)
  @IsOptional()
  emergencyPhone?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
