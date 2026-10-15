import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** 修改用户/管理员状态 */
export class UpdateUserStatusDto {
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  status: number;
}
