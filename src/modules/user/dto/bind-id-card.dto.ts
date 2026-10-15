import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

/** 实名认证：绑定身份证 */
export class BindIdCardDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{17}[\dXx]$/)
  idCard: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  realName?: string;
}
