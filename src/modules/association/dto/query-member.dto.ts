import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 协会会员分页查询 DTO（后台）
 */
export class QueryMemberDto extends PaginationDto {
  /** 会员状态：0待审核 1已通过 2已拒绝 3已退出 4被移除；不传则全部 */
  @IsInt()
  @IsIn([0, 1, 2, 3, 4])
  @IsOptional()
  @Type(() => Number)
  status?: number;

  /** 协会内角色：1会长 2管理员 3普通会员；不传则全部 */
  @IsInt()
  @IsIn([1, 2, 3])
  @IsOptional()
  @Type(() => Number)
  role?: number;

  /** 真实姓名 / 会员编号 模糊搜索 */
  @IsString()
  @IsOptional()
  keyword?: string;

  /** 联系电话模糊搜索 */
  @IsString()
  @IsOptional()
  phone?: string;

  /** 是否缴纳保险：0未缴 1已缴；不传则全部 */
  @IsInt()
  @IsIn([0, 1])
  @IsOptional()
  @Type(() => Number)
  hasInsurance?: number;

  /** 性别（按关联用户）：0未知 1男 2女；不传则全部 */
  @IsInt()
  @IsIn([0, 1, 2])
  @IsOptional()
  @Type(() => Number)
  gender?: number;

  /** 入会时间起（YYYY-MM-DD，含当天） */
  @IsString()
  @IsOptional()
  joinedStart?: string;

  /** 入会时间止（YYYY-MM-DD，含当天） */
  @IsString()
  @IsOptional()
  joinedEnd?: string;
}
