import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

/** 创建赛事赞助商 DTO */
export class CreateCompetitionSponsorDto {
  /** 公司名称 */
  @IsString()
  @MaxLength(100)
  name: string;

  /** 公司主页 URL */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  website?: string;

  /** 主营业务 */
  @IsString()
  @IsOptional()
  @MaxLength(255)
  business?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sort?: number;
}

export class UpdateCompetitionSponsorDto extends PartialType(
  CreateCompetitionSponsorDto,
) {}
