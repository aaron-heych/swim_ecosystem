import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 通知下发流水查询 DTO（后台）
 */
export class QueryLogsDto extends PaginationDto {
  /** 渠道：1小程序订阅消息 2公众号模板消息 3短信 */
  @IsInt()
  @IsIn([1, 2, 3])
  @IsOptional()
  @Type(() => Number)
  channel?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  userId?: number;

  @IsString()
  @IsOptional()
  templateCode?: string;

  /** 发送状态：0待发送 1成功 2失败 */
  @IsInt()
  @IsIn([0, 1, 2])
  @IsOptional()
  @Type(() => Number)
  status?: number;

  /** 业务类型：association/event/activity/appointment/card */
  @IsString()
  @IsOptional()
  bizType?: string;

  /** 起始日期 YYYY-MM-DD */
  @IsString()
  @IsOptional()
  startDate?: string;

  /** 结束日期 YYYY-MM-DD */
  @IsString()
  @IsOptional()
  endDate?: string;
}
