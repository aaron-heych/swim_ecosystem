import { IsNotEmpty, IsString, Length } from 'class-validator';

/** 后台登录 */
export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  password: string;
}
