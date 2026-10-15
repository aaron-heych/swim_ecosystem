import { PartialType } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';

/** 更新冬泳活动 DTO（全字段可选） */
export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
