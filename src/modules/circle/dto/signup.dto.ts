/**
 * 活动报名 DTO
 */
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ActivitySignupDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  signupRemark?: string;
}
