import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 用户接受订阅授权 DTO
 * 每条 templateId 对应的 UserSubscribe 记录 quota +1，更新 lastAcceptAt
 */
export class SubscribeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  templateIds: number[];
}
