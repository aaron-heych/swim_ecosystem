import { IsNotEmpty, IsString, Length } from 'class-validator';

/** 重置管理员密码 */
export class ResetAdminPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  password: string;
}
