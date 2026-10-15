import { PartialType } from '@nestjs/swagger';
import { CreateCompetitionResultDto } from './result.dto';

/**
 * 更新个人成绩（局部更新）
 */
export class UpdateCompetitionResultDto extends PartialType(
  CreateCompetitionResultDto,
) {}
