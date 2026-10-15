import { PartialType } from '@nestjs/swagger';
import { CreateParticipationDto } from './create-participation.dto';

/**
 * 更新参与协会（局部更新，所有字段可选）
 */
export class UpdateParticipationDto extends PartialType(CreateParticipationDto) {}
