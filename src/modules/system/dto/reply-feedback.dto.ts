/**
 * 反馈回复 DTO — 后台
 */
import { IsString, MaxLength } from 'class-validator';

export class ReplyFeedbackDto {
  @IsString()
  @MaxLength(1000)
  reply: string;
}
