import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryAppointmentDto extends PaginationDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  coachId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  /** 预约状态：0待确认 1已确认 2已完成 3用户取消 4教练取消 5爽约 */
  @IsInt()
  @Min(0)
  @Max(5)
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

export class UpdateAppointmentStatusDto {
  /** 0待确认 1已确认 2已完成 3用户取消 4教练取消 5爽约 */
  @IsInt()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  status: number;

  @IsString()
  @IsOptional()
  cancelReason?: string;

  /** 取消方：1用户 2教练 3系统 */
  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  @Type(() => Number)
  cancelBy?: number;
}

export class UpdateAppointmentPayStatusDto {
  /** 0待支付 1已支付 2已退款 */
  @IsInt()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  payStatus: number;

  @IsString()
  @IsOptional()
  transactionId?: string;
}
