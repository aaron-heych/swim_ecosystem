import { PartialType } from '@nestjs/swagger';
import { CreateCompetitionDto } from './create-competition.dto';

/** 更新冬泳赛事 DTO（全字段可选） */
export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {}
