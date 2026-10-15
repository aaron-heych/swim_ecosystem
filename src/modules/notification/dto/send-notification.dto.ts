import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 后台手动触发通知下发 DTO
 * channel 由 templateCode 关联的模板自动决定
 */
export class SendNotificationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  userIds: number[];

  @IsString()
  @MaxLength(64)
  templateCode: string;

  /** 模板参数 */
  @IsObject()
  data: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  bizType?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  bizId?: number;
}
