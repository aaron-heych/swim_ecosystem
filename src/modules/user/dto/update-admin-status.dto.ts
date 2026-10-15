import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** 修改 C 端用户状态（启用/禁用） */
export class UpdateAdminUserStatusDto {
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status: number;
}
