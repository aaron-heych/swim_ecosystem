import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryRegistrationDto extends PaginationDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  eventId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  /** 报名状态：0待支付 1已报名 2已取消 3已退费 */
  @IsInt()
  @Min(0)
  @Max(3)
  @IsOptional()
  @Type(() => Number)
  status?: number;

  /** 支付状态：0待支付 1已支付 2已退款 */
  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  payStatus?: number;

  @IsString()
  @IsOptional()
  orderNo?: string;
}

export class UpdateRegistrationPayStatusDto {
  /** 支付状态：0待支付 1已支付 2已退款 */
  @IsInt()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  payStatus: number;

  @IsString()
  @IsOptional()
  transactionId?: string;
}
