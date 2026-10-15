import { IsNotEmpty, IsString, Length } from 'class-validator';

/** 微信小程序登录 */
export class WxLoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  code: string;
}
