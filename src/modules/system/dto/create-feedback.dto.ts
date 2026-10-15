/**
 * 用户意见反馈 DTO
 */
import { IsInt, IsOptional, IsString, IsArray, MaxLength, Min, Max } from 'class-validator';

export class CreateFeedbackDto {
  /** 类型：1功能建议 2问题反馈 3投诉 4其他 */
  @IsInt()
  @Min(1)
  @Max(4)
  type: number;

  @IsString()
  @MaxLength(1000)
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(128)
  contact?: string;
}
