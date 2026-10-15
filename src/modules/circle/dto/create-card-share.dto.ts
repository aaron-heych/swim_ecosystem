/**
 * 代刷卡扩展 DTO（type=1）
 */
import { IsInt, IsOptional, IsString, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCardShareDto {
  @IsNumber()
  @Type(() => Number)
  venueId: number;

  /** 卡类型：1次卡 2期限卡 */
  @IsInt()
  @Min(1)
  @Max(2)
  cardType: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  totalTimes?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  remainTimes?: number;

  @IsString()
  @IsOptional()
  expireDate?: string;

  /** 报价方式：1按次 2一口价 */
  @IsInt()
  @Min(1)
  @Max(2)
  priceType: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  tradeMethod?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  contactWechat?: string;
}
